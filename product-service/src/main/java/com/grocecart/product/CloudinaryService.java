package com.grocecart.product;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import java.io.IOException;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class CloudinaryService {
    private final Cloudinary cloudinary;

    public CloudinaryService(@Value("${cloudinary.name:}") String name,
                             @Value("${cloudinary.api-key:}") String key,
                             @Value("${cloudinary.api-secret:}") String secret) {
        this.cloudinary = new Cloudinary(ObjectUtils.asMap("cloud_name", name, "api_key", key, "api_secret", secret, "secure", true));
    }

    public String upload(MultipartFile file) throws IOException {
        Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap("resource_type", "image"));
        return (String) result.get("secure_url");
    }
}
