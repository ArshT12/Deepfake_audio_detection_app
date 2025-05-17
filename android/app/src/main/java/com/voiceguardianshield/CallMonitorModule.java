
package com.voiceguardianshield;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.telephony.PhoneStateListener;
import android.telephony.TelephonyManager;
import android.widget.Toast;

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
import java.nio.ShortBuffer;
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
    private boolean useFallbackMode = false;
    private AudioManager audioManager;
    
    // Required permissions for direct call audio
    private static final String[] REQUIRED_PERMISSIONS = {
            Manifest.permission.READ_PHONE_STATE,
            Manifest.permission.PROCESS_OUTGOING_CALLS,
            Manifest.permission.RECORD_AUDIO
    };

    // Add READ_CALL_LOG permission for Android 9+
    private static final String[] CALL_LOG_PERMISSIONS = {
            Manifest.permission.READ_CALL_LOG
    };
    
    // Additional permissions for direct call audio (may not be granted on all devices)
    private static final String[] DIRECT_AUDIO_PERMISSIONS = {
            Manifest.permission.CAPTURE_AUDIO_OUTPUT
    };

    public CallMonitorModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.executor = Executors.newSingleThreadExecutor();
        this.audioManager = (AudioManager) reactContext.getSystemService(Context.AUDIO_SERVICE);
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
    public void canAccessCallAudio(Promise promise) {
        boolean canAccessDirectAudio = true;
        
        // Check if we have the special permission for direct call audio
        for (String permission : DIRECT_AUDIO_PERMISSIONS) {
            if (ContextCompat.checkSelfPermission(reactContext, permission) != PackageManager.PERMISSION_GRANTED) {
                canAccessDirectAudio = false;
                break;
            }
        }
        
        // Also check if device supports voice call recording - many don't
        boolean hasVoiceCallRecording = false;
        for (int source : new int[]{MediaRecorder.AudioSource.VOICE_CALL, MediaRecorder.AudioSource.VOICE_COMMUNICATION}) {
            try {
                int minBufferSize = AudioRecord.getMinBufferSize(44100, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT);
                AudioRecord testRecorder = new AudioRecord(source, 44100, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT, minBufferSize);
                if (testRecorder.getState() == AudioRecord.STATE_INITIALIZED) {
                    hasVoiceCallRecording = true;
                    testRecorder.release();
                    break;
                }
                testRecorder.release();
            } catch (Exception e) {
                // This source is not available
            }
        }
        
        // We need both permissions and hardware support
        promise.resolve(canAccessDirectAudio && hasVoiceCallRecording);
    }

    @ReactMethod
    public void requestPermissions(Promise promise) {
        PermissionAwareActivity activity = (PermissionAwareActivity) reactContext.getCurrentActivity();
        if (activity == null) {
            promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "Activity doesn't exist");
            return;
        }

        // Combine all required permissions
        String[] allPermissions = new String[REQUIRED_PERMISSIONS.length + CALL_LOG_PERMISSIONS.length + DIRECT_AUDIO_PERMISSIONS.length];
        System.arraycopy(REQUIRED_PERMISSIONS, 0, allPermissions, 0, REQUIRED_PERMISSIONS.length);
        System.arraycopy(CALL_LOG_PERMISSIONS, 0, allPermissions, REQUIRED_PERMISSIONS.length, CALL_LOG_PERMISSIONS.length);
        System.arraycopy(DIRECT_AUDIO_PERMISSIONS, 0, allPermissions, REQUIRED_PERMISSIONS.length + CALL_LOG_PERMISSIONS.length, DIRECT_AUDIO_PERMISSIONS.length);
        
        activity.requestPermissions(allPermissions, PERMISSION_REQUEST_CODE, (requestCode, receivedPermissions, grantResults) -> {
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
    public void startMonitoring(boolean useFallback, Promise promise) {
        if (isMonitoring) {
            promise.resolve(true);
            return;
        }

        try {
            this.useFallbackMode = useFallback;
            
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
    public void optimizeBackgroundMonitoring(boolean useFallback, Promise promise) {
        // Implement any specific optimizations needed for background operation
        // This might involve reducing audio quality, processing frequency, etc.
        promise.resolve(true);
    }
    
    @ReactMethod
    public void refreshMonitoring(boolean useFallback, Promise promise) {
        // Refresh monitoring when app comes to foreground
        this.useFallbackMode = useFallback;
        promise.resolve(true);
    }
    
    @ReactMethod
    public void promptLoudspeaker(Promise promise) {
        // Turn on speakerphone if possible
        try {
            if (audioManager != null && !audioManager.isSpeakerphoneOn()) {
                audioManager.setSpeakerphoneOn(true);
                
                // Show a toast to the user
                new Handler(Looper.getMainLooper()).post(() -> {
                    Toast.makeText(reactContext, "Please keep speakerphone on for voice analysis", Toast.LENGTH_LONG).show();
                });
            }
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("E_SPEAKER_ERROR", e.getMessage());
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
            
            // Turn off speakerphone if it was enabled
            if (audioManager != null && audioManager.isSpeakerphoneOn()) {
                audioManager.setSpeakerphoneOn(false);
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
        params.putBoolean("usingDirectAudio", !useFallbackMode);

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
                startAudioRecording(useFallbackMode);
                break;
        }

        params.putDouble("timestamp", new Date().getTime());
        sendEvent("CallStateChanged", params);
    }

    private void startAudioRecording(boolean useFallbackMode) {
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
                
                // Choose the appropriate audio source based on mode
                int audioSource;
                if (useFallbackMode) {
                    // If using fallback, record from microphone (which requires speakerphone)
                    audioSource = MediaRecorder.AudioSource.MIC;
                    
                    // Turn on speakerphone for fallback mode
                    if (audioManager != null) {
                        audioManager.setSpeakerphoneOn(true);
                    }
                } else {
                    // Try to use direct call audio if available
                    audioSource = MediaRecorder.AudioSource.VOICE_CALL;
                }
                
                audioRecord = new AudioRecord(
                        audioSource,
                        44100,
                        AudioFormat.CHANNEL_IN_MONO,
                        AudioFormat.ENCODING_PCM_16BIT,
                        bufferSize
                );

                // If direct call audio didn't work, fall back to voice communication
                if (audioRecord.getState() != AudioRecord.STATE_INITIALIZED && !useFallbackMode) {
                    audioRecord.release();
                    audioSource = MediaRecorder.AudioSource.VOICE_COMMUNICATION;
                    audioRecord = new AudioRecord(
                            audioSource,
                            44100,
                            AudioFormat.CHANNEL_IN_MONO,
                            AudioFormat.ENCODING_PCM_16BIT,
                            bufferSize
                    );
                }
                
                // If still not working, fall back to microphone
                if (audioRecord.getState() != AudioRecord.STATE_INITIALIZED) {
                    audioRecord.release();
                    audioSource = MediaRecorder.AudioSource.MIC;
                    
                    // Turn on speakerphone for fallback to microphone
                    if (audioManager != null) {
                        audioManager.setSpeakerphoneOn(true);
                    }
                    
                    audioRecord = new AudioRecord(
                            audioSource,
                            44100,
                            AudioFormat.CHANNEL_IN_MONO,
                            AudioFormat.ENCODING_PCM_16BIT,
                            bufferSize
                    );
                }

                if (audioRecord.getState() != AudioRecord.STATE_INITIALIZED) {
                    // If we still can't initialize, report error
                    new Handler(Looper.getMainLooper()).post(() -> {
                        WritableMap result = Arguments.createMap();
                        result.putBoolean("isDeepfake", false);
                        result.putDouble("confidence", 0);
                        result.putString("error", "Could not initialize audio recording");
                        sendEvent("AudioAnalysisResult", result);
                    });
                    return;
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
                            
                            // Perform audio analysis (in a real app, this would be more sophisticated)
                            analyzeAudioChunk(buffer, samplesRead, audioChunk.getAbsolutePath());
                            
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
    
    private void analyzeAudioChunk(byte[] buffer, int length, String audioPath) {
        // In a real implementation, this would use your deepfake detection algorithm
        // For now, we'll use a simple simulation
        
        // Convert byte array to short array (PCM 16-bit)
        ShortBuffer shortBuffer = ByteBuffer.wrap(buffer, 0, length).asShortBuffer();
        short[] audioShorts = new short[shortBuffer.limit()];
        shortBuffer.get(audioShorts);
        
        // Calculate some basic audio metrics
        long sum = 0;
        long sumOfSquares = 0;
        for (short sample : audioShorts) {
            sum += sample;
            sumOfSquares += sample * sample;
        }
        
        // Simulated analysis (30% chance of being classified as deepfake)
        final boolean isDeepfake = Math.random() < 0.3;
        final int confidence = isDeepfake ? 
                (int)(75 + Math.random() * 20) : // Higher confidence for deepfakes (75-95%)
                (int)(65 + Math.random() * 30);  // Variable confidence for authentic (65-95%)
        
        // Send the analysis result to React Native
        new Handler(Looper.getMainLooper()).post(() -> {
            WritableMap result = Arguments.createMap();
            result.putBoolean("isDeepfake", isDeepfake);
            result.putDouble("confidence", confidence);
            result.putString("audioSample", audioPath); // Path to audio sample
            sendEvent("AudioAnalysisResult", result);
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
