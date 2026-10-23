package com.grocecart.product;

import com.grocecart.common.InternalAuth;
import com.grocecart.common.Js;
import jakarta.servlet.http.HttpServletRequest;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal/products")
public class InternalProductController {
    private final ProductRepository repo;
    private final CatalogService catalog;
    private final InternalAuth internal;

    public InternalProductController(ProductRepository repo, CatalogService catalog, InternalAuth internal) {
        this.repo = repo;
        this.catalog = catalog;
        this.internal = internal;
    }

    /** id -> {image, name} for order screens. Resolves both DB products and bundled catalogue items. */
    @PostMapping("/lookup")
    public Map<String, Map<String, Object>> lookup(HttpServletRequest req, @RequestBody Map<String, Object> body) {
        internal.require(req);
        @SuppressWarnings("unchecked")
        List<Object> ids = (List<Object>) body.getOrDefault("ids", List.of());
        Map<String, Map<String, Object>> out = new LinkedHashMap<>();
        for (Object o : ids) {
            String id = String.valueOf(o);
            Map<String, Object> c = catalog.find(id);
            if (c != null) {
                List<?> imgs = (List<?>) c.get("imageUrl");
                out.put(id, Js.map("image", imgs.isEmpty() ? null : imgs.get(0), "name", c.get("name")));
            }
        }
        List<String> dbIds = ids.stream().map(String::valueOf).filter(Js::isObjectId).toList();
        for (Product p : repo.findAllById(dbIds))
            out.put(p.getId(), Js.map("image", p.getImageUrl().isEmpty() ? null : p.getImageUrl().get(0), "name", p.getName()));
        return out;
    }
}
