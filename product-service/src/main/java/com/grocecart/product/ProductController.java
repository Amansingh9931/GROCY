package com.grocecart.product;

import com.grocecart.common.AuthGuard;
import com.grocecart.common.Js;
import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/** Port of productController.js + AdminProductRoute.js + UserProductRoute.js. */
@RestController
public class ProductController {
    private static final Logger log = LoggerFactory.getLogger(ProductController.class);
    static final String CACHE_KEY = "catalogue:all-products:v1";
    static final long CACHE_TTL_SECONDS = 300;

    private final ProductRepository repo;
    private final CatalogService catalog;
    private final CacheService cache;
    private final CloudinaryService cloudinary;
    private final AuthGuard guard;

    public ProductController(ProductRepository repo, CatalogService catalog, CacheService cache,
                             CloudinaryService cloudinary, AuthGuard guard) {
        this.repo = repo;
        this.catalog = catalog;
        this.cache = cache;
        this.cloudinary = cloudinary;
        this.guard = guard;
    }

    private static ResponseEntity<Map<String, Object>> fail(int s, String m) {
        return ResponseEntity.status(s).body(Js.map("success", false, "message", m));
    }

    // ---------- public ----------

    @GetMapping("/api/products/list")
    public ResponseEntity<Map<String, Object>> listAll() {
        try {
            List<Object> cached = cache.get(CACHE_KEY);
            if (cached != null) return ResponseEntity.ok(Js.map("success", true, "products", cached, "cached", true));

            List<Object> products = new ArrayList<>(repo.findAll());
            products.addAll(catalog.all());
            cache.set(CACHE_KEY, products, CACHE_TTL_SECONDS);
            return ResponseEntity.ok(Js.map("success", true, "products", products, "cached", false));
        } catch (Exception e) {
            log.error("List all products error", e);
            return fail(500, "Failed to load products");
        }
    }

    @GetMapping({"/api/products/{id}", "/api/admin/products/{id}"})
    public ResponseEntity<Map<String, Object>> single(HttpServletRequest req, @PathVariable String id) {
        if (req.getRequestURI().startsWith("/api/admin/")) guard.admin(req);
        try {
            Map<String, Object> cat = catalog.find(id);
            if (cat != null) return ResponseEntity.ok(Js.map("success", true, "product", cat));
            if (!Js.isObjectId(id)) return fail(400, "Invalid product ID");

            Product p = repo.findById(id).orElse(null);
            if (p == null) return fail(404, "Product not found");
            return ResponseEntity.ok(Js.map("success", true, "product", Js.map(
                    "_id", p.getId(), "name", p.getName(), "description", p.getDescription(), "price", p.getPrice(),
                    "imageUrl", p.getImageUrl(), "category", p.getCategory(), "stock", p.getStock())));
        } catch (Exception e) {
            log.error("Single product error", e);
            return fail(500, "Failed to fetch product");
        }
    }

    // ---------- admin ----------

    @GetMapping("/api/admin/products")
    public ResponseEntity<Map<String, Object>> listAdmin(HttpServletRequest req) {
        guard.admin(req);
        try {
            return ResponseEntity.ok(Js.map("success", true, "products", repo.findAll()));
        } catch (Exception e) {
            return ResponseEntity.ok(Js.map("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/api/admin/products/add")
    public ResponseEntity<Map<String, Object>> add(HttpServletRequest req,
            @RequestParam(required = false) String name, @RequestParam(required = false) String description,
            @RequestParam(required = false) String price, @RequestParam(required = false) String category,
            @RequestParam(required = false) String stock,
            @RequestPart(value = "image1", required = false) MultipartFile image1,
            @RequestPart(value = "image2", required = false) MultipartFile image2,
            @RequestPart(value = "image3", required = false) MultipartFile image3,
            @RequestPart(value = "image4", required = false) MultipartFile image4) {
        guard.admin(req);
        try {
            List<MultipartFile> images = new ArrayList<>();
            for (MultipartFile f : new MultipartFile[]{image1, image2, image3, image4})
                if (f != null && !f.isEmpty()) images.add(f);
            if (images.isEmpty()) return fail(400, "At least one image is required");
            if (!Js.truthy(name) || !Js.truthy(description) || !Js.truthy(price))
                return fail(400, "name, description and price are required");

            List<String> urls = new ArrayList<>();
            for (MultipartFile f : images) urls.add(cloudinary.upload(f));

            Product p = new Product();
            p.setName(name);
            p.setDescription(description);
            p.setPrice(Js.num(price, 0));
            p.setImageUrl(urls);
            p.setCategory(category);
            p.setStock((int) Js.num(stock, 0));
            repo.save(p);
            cache.delete(CACHE_KEY);
            return ResponseEntity.ok(Js.map("success", true, "message", "Product added successfully"));
        } catch (Exception e) {
            log.error("Add product error", e);
            return fail(500, e.getMessage() == null ? "Failed to add product" : e.getMessage());
        }
    }

    @PutMapping("/api/admin/products/edit/{id}")
    public ResponseEntity<Map<String, Object>> edit(HttpServletRequest req, @PathVariable String id,
            @RequestParam(required = false) String name, @RequestParam(required = false) String description,
            @RequestParam(required = false) String category, @RequestParam(required = false) String price,
            @RequestParam(required = false) String stock,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) {
        guard.admin(req);
        try {
            Product p = repo.findById(id).orElse(null);
            if (p == null) return fail(404, "Product not found");

            if (name != null) p.setName(name);
            if (description != null) p.setDescription(description);
            if (category != null) p.setCategory(category);
            if (price != null) p.setPrice(Js.num(price, 0));
            if (stock != null) p.setStock((int) Js.num(stock, 0));

            if (images != null) {
                List<String> merged = new ArrayList<>(p.getImageUrl());
                for (MultipartFile f : images) if (f != null && !f.isEmpty()) merged.add(cloudinary.upload(f));
                p.setImageUrl(merged);
            }
            repo.save(p);
            cache.delete(CACHE_KEY);
            return ResponseEntity.ok(Js.map("success", true, "message", "Product updated successfully", "product", p));
        } catch (Exception e) {
            log.error("Edit product error", e);
            return fail(500, "Failed to edit product");
        }
    }

    @DeleteMapping("/api/admin/products/delete/{id}")
    public ResponseEntity<Map<String, Object>> delete(HttpServletRequest req, @PathVariable String id) {
        guard.admin(req);
        try {
            if (!repo.existsById(id)) return fail(404, "Product not found");
            repo.deleteById(id);
            cache.delete(CACHE_KEY);
            return ResponseEntity.ok(Js.map("success", true, "message", "Product deleted successfully"));
        } catch (Exception e) {
            log.error("Delete product error", e);
            return fail(500, "Failed to delete product");
        }
    }
}
