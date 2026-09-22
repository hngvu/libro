package soqe.libro.server.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "aws.s3")
public class AwsS3Properties {
    private boolean enabled = false;
    private String accessKey;
    private String secretKey;
    private String region = "ap-southeast-1";
    private String bucketName = "libro-storage";
    private String endpoint; // Optional: custom endpoint for MinIO / LocalStack / Cloudflare R2
    private String publicUrlPrefix; // Optional: custom CDN domain (e.g. https://cdn.example.com)
}
