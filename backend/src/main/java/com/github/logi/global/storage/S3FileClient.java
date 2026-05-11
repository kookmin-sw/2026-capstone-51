package com.github.logi.global.storage;

import com.github.logi.global.property.S3Property;
import com.github.logi.global.storage.exception.StorageExceptions;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;

@Slf4j
@Component
@RequiredArgsConstructor
public class S3FileClient {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final S3Property s3Property;

    public String generateUploadUrl(String fileKey, String contentType) {
        try {
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(s3Property.getBucket())
                    .key(fileKey)
                    .contentType(contentType)
                    .build();

            PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(s3Property.getUploadUrlExpirationMinutes()))
                    .putObjectRequest(putRequest)
                    .build();

            return s3Presigner.presignPutObject(presignRequest).url().toString();
        } catch (SdkException e) {
            throw StorageExceptions.UPLOAD_URL_FAILED.toException(e);
        }
    }

    public String generateDownloadUrl(String fileKey) {
        try {
            GetObjectRequest getRequest = GetObjectRequest.builder()
                    .bucket(s3Property.getBucket())
                    .key(fileKey)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(s3Property.getDownloadUrlExpirationMinutes()))
                    .getObjectRequest(getRequest)
                    .build();

            return s3Presigner.presignGetObject(presignRequest).url().toString();
        } catch (SdkException e) {
            throw StorageExceptions.DOWNLOAD_URL_FAILED.toException(e);
        }
    }

    public void delete(String fileKey) {
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(s3Property.getBucket())
                    .key(fileKey)
                    .build());
        } catch (SdkException e) {
            log.warn("[S3] failed to delete object key={} cause={}", fileKey, e.getMessage());
        }
    }
}
