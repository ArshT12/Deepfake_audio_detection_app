
package com.voiceguardianshield;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.os.Build;
import android.telephony.PhoneStateListener;
import android.telephony.TelephonyManager;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.core.PermissionAwareActivity;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.ByteBuffer;
import java.util.Date;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class CallMonitorModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;
    private TelephonyManager telephonyManager;
    private PhoneStateListener phoneStateListener;
    private boolean isMonitoring = false;
    private AudioRecord audioRecord;
    private boolean isRecording = false;
    private ExecutorService executor;
    private static final int PERMISSION_REQUEST_CODE = 100;
    private static final String[] REQUIRED_PERMISSIONS = {
            Manifest.permission.READ_PHONE_STATE,
            Manifest.permission.PROCESS_OUTGOING_CALLS,
            Manifest.permission.RECORD_AUDIO
    };

    // Add READ_CALL_LOG permission for Android 9+
    private static final String[] CALL_LOG_PERMISSIONS = {
            Manifest.permission.READ_CALL_LOG
    };

    public CallMonitorModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.executor = Executors.newSingleThreadExecutor();
    }

    @NonNull
    @Override
    public String getName() {
        return "CallMonitorModule";
    }

    private void sendEvent(String eventName, WritableMap params) {
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
    }

    @ReactMethod
    public void isAvailable(Promise promise) {
        boolean hasPermissions = true;
        for (String permission : REQUIRED_PERMISSIONS) {
            if (ContextCompat.checkSelfPermission(reactContext, permission) != PackageManager.PERMISSION_GRANTED) {
                hasPermissions = false;
                break;
            }
        }

        // For Android 9+, check call log permissions
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            for (String permission : CALL_LOG_PERMISSIONS) {
                if (ContextCompat.checkSelfPermission(reactContext, permission) != PackageManager.PERMISSION_GRANTED) {
                    hasPermissions = false;
                    break;
                }
            }
        }

        promise.resolve(hasPermissions);
    }

    @ReactMethod
    public void requestPermissions(Promise promise) {
        PermissionAwareActivity activity = (PermissionAwareActivity) reactContext.getCurrentActivity();
        if (activity == null) {
            promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "Activity doesn't exist");
            return;
        }

        // Combine permissions based on Android version
        String[] permissions;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            permissions = new String[REQUIRED_PERMISSIONS.length + CALL_LOG_PERMISSIONS.length];
            System.arraycopy(REQUIRED_PERMISSIONS, 0, permissions, 0, REQUIRED_PERMISSIONS.length);
            System.arraycopy(CALL_LOG_PERMISSIONS, 0, permissions, REQUIRED_PERMISSIONS.length, CALL_LOG_PERMISSIONS.length);
        } else {
            permissions = REQUIRED_PERMISSIONS;
        }

        activity.requestPermissions(permissions, PERMISSION_REQUEST_CODE, (requestCode, receivedPermissions, grantResults) -> {
            if (requestCode == PERMISSION_REQUEST_CODE) {
                boolean allGranted = true;
                for (int result : grantResults) {
                    if (result != PackageManager.PERMISSION_GRANTED) {
                        allGranted = false;
                        break;
                    }
                }
                promise.resolve(allGranted);
            } else {
                promise.resolve(false);
            }
        });
    }

    @ReactMethod
    public void initialize(Promise promise) {
        if (telephonyManager != null) {
            promise.resolve(true);
            return;
        }

        try {
            telephonyManager = (TelephonyManager) reactContext.getSystemService(Context.TELEPHONY_SERVICE);
            
            // Initialize phone state listener
            phoneStateListener = new PhoneStateListener() {
                @Override
                public void onCallStateChanged(int state, String phoneNumber) {
                    handleCallStateChanged(state, phoneNumber);
                }
            };
            
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("E_INITIALIZATION_FAILED", e.getMessage());
        }
    }

    @ReactMethod
    public void startMonitoring(Promise promise) {
        if (isMonitoring) {
            promise.resolve(true);
            return;
        }

        try {
            if (telephonyManager == null) {
                initialize(new Promise() {
                    @Override
                    public void resolve(Object value) {
                        if (Boolean.TRUE.equals(value)) {
                            startMonitoringInternal(promise);
                        } else {
                            promise.reject("E_INITIALIZATION_FAILED", "Could not initialize telephony manager");
                        }
                    }

                    @Override
                    public void reject(String code, String message) {
                        promise.reject(code, message);
                    }

                    @Override
                    public void reject(String code, Throwable e) {
                        promise.reject(code, e);
                    }

                    @Override
                    public void reject(String code, String message, Throwable e) {
                        promise.reject(code, message, e);
                    }

                    @Override
                    public void reject(Throwable e) {
                        promise.reject(e);
                    }

                    @Override
                    public void reject(Throwable e, WritableMap userInfo) {
                        promise.reject(e, userInfo);
                    }

                    @Override
                    public void reject(String code, WritableMap userInfo) {
                        promise.reject(code, userInfo);
                    }

                    @Override
                    public void reject(String code, Throwable e, WritableMap userInfo) {
                        promise.reject(code, e, userInfo);
                    }

                    @Override
                    public void reject(String code, String message, WritableMap userInfo) {
                        promise.reject(code, message, userInfo);
                    }

                    @Override
                    public void reject(String code, String message, Throwable e, WritableMap userInfo) {
                        promise.reject(code, message, e, userInfo);
                    }
                });
            } else {
                startMonitoringInternal(promise);
            }
        } catch (Exception e) {
            promise.reject("E_START_MONITORING_FAILED", e.getMessage());
        }
    }

    private void startMonitoringInternal(Promise promise) {
        try {
            telephonyManager.listen(phoneStateListener, PhoneStateListener.LISTEN_CALL_STATE);
            isMonitoring = true;
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("E_START_MONITORING_FAILED", e.getMessage());
        }
    }

    @ReactMethod
    public void stopMonitoring(Promise promise) {
        if (!isMonitoring) {
            promise.resolve(true);
            return;
        }

        try {
            if (telephonyManager != null && phoneStateListener != null) {
                telephonyManager.listen(phoneStateListener, PhoneStateListener.LISTEN_NONE);
            }
            
            if (isRecording) {
                stopAudioRecording();
            }
            
            isMonitoring = false;
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("E_STOP_MONITORING_FAILED", e.getMessage());
        }
    }

    @ReactMethod
    public void endCall(Promise promise) {
        // This is a dangerous operation and requires system permissions
        // that most apps cannot get in modern Android versions
        promise.reject("E_OPERATION_NOT_SUPPORTED", "Ending calls programmatically is not supported");
    }

    private void handleCallStateChanged(int state, String phoneNumber) {
        WritableMap params = Arguments.createMap();
        params.putString("phoneNumber", phoneNumber != null ? phoneNumber : "Unknown");

        switch (state) {
            case TelephonyManager.CALL_STATE_IDLE:
                params.putString("state", "IDLE");
                params.putBoolean("isIncoming", false);
                
                // Stop recording if we were recording
                if (isRecording) {
                    stopAudioRecording();
                }
                break;
            case TelephonyManager.CALL_STATE_RINGING:
                params.putString("state", "RINGING");
                params.putBoolean("isIncoming", true);
                break;
            case TelephonyManager.CALL_STATE_OFFHOOK:
                params.putString("state", "OFFHOOK");
                // We don't know if it's incoming at this point without additional tracking
                params.putBoolean("isIncoming", false);
                
                // Start recording call audio
                startAudioRecording();
                break;
        }

        params.putDouble("timestamp", new Date().getTime());
        sendEvent("CallStateChanged", params);
    }

    private void startAudioRecording() {
        if (isRecording) return;

        executor.execute(() -> {
            try {
                // Set up audio recorder
                int bufferSize = AudioRecord.getMinBufferSize(
                        44100,
                        AudioFormat.CHANNEL_IN_MONO,
                        AudioFormat.ENCODING_PCM_16BIT
                );

                if (ActivityCompat.checkSelfPermission(reactContext, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                    return;
                }
                
                audioRecord = new AudioRecord(
                        MediaRecorder.AudioSource.VOICE_CALL, // Use VOICE_CALL to capture call audio if possible
                        44100,
                        AudioFormat.CHANNEL_IN_MONO,
                        AudioFormat.ENCODING_PCM_16BIT,
                        bufferSize
                );

                if (audioRecord.getState() != AudioRecord.STATE_INITIALIZED) {
                    // Fall back to microphone if we can't capture call audio directly
                    audioRecord = new AudioRecord(
                            MediaRecorder.AudioSource.MIC,
                            44100,
                            AudioFormat.CHANNEL_IN_MONO,
                            AudioFormat.ENCODING_PCM_16BIT,
                            bufferSize
                    );
                }

                audioRecord.startRecording();
                isRecording = true;

                // File to save audio chunks
                File outputDir = reactContext.getCacheDir();
                File outputFile = new File(outputDir, "call_audio_" + System.currentTimeMillis() + ".pcm");
                FileOutputStream outputStream = new FileOutputStream(outputFile);

                // Read and save audio data
                byte[] buffer = new byte[bufferSize];
                int samplesRead = 0;
                int totalSamplesRead = 0;
                int analysisInterval = 5 * 44100; // 5 seconds of audio at 44.1kHz
                
                while (isRecording) {
                    samplesRead = audioRecord.read(buffer, 0, buffer.length);
                    
                    if (samplesRead > 0) {
                        outputStream.write(buffer, 0, samplesRead);
                        totalSamplesRead += samplesRead;
                        
                        // After collecting enough samples for analysis (e.g., 5 seconds)
                        if (totalSamplesRead >= analysisInterval) {
                            // Notify JS that we have audio data ready for analysis
                            File audioChunk = new File(outputDir, "audio_chunk_" + System.currentTimeMillis() + ".pcm");
                            FileOutputStream chunkStream = new FileOutputStream(audioChunk);
                            chunkStream.write(buffer, 0, samplesRead);
                            chunkStream.close();
                            
                            WritableMap audioParams = Arguments.createMap();
                            audioParams.putString("audioPath", audioChunk.getAbsolutePath());
                            reactContext.runOnUiQueueThread(() -> {
                                sendEvent("AudioChunkReady", audioParams);
                            });
                            
                            totalSamplesRead = 0;
                        }
                    }
                }
                
                outputStream.close();
                
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }

    private void stopAudioRecording() {
        if (!isRecording) return;
        
        isRecording = false;
        if (audioRecord != null) {
            try {
                audioRecord.stop();
                audioRecord.release();
                audioRecord = null;
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}
