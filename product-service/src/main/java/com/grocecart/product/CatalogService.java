package com.grocecart.product;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

/** Port of catalogService.js: the bundled grocery CSV (catalog.csv, formerly Backend/data.py). */
@Service
public class CatalogService {
    private static final Logger log = LoggerFactory.getLogger(CatalogService.class);
    private static final Pattern FLOAT_PREFIX = Pattern.compile("^\\s*[+-]?(\\d+\\.?\\d*|\\.\\d+)([eE][+-]?\\d+)?");

    private List<Map<String, Object>> products = List.of();
    private Map<String, Map<String, Object>> byId = Map.of();

    @PostConstruct
    void load() throws IOException {
        String content = new String(new ClassPathResource("catalog.csv").getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        List<List<String>> rows = parseCsv(content);
        List<Map<String, Object>> list = new ArrayList<>();
        Map<String, Map<String, Object>> index = new LinkedHashMap<>();
        for (int i = 1; i < rows.size(); i++) { // skip header
            Map<String, Object> p = toCatalogProduct(rows.get(i));
            if (p != null) {
                list.add(p);
                index.put((String) p.get("_id"), p);
            }
        }
        products = Collections.unmodifiableList(list);
        byId = index;
        log.info("Loaded {} catalogue products", products.size());
    }

    public List<Map<String, Object>> all() { return products; }

    public Map<String, Object> find(String id) { return id != null && id.startsWith("catalog-") ? byId.get(id) : null; }

    /** Quote-aware CSV parser identical in behaviour to the original. */
    static List<List<String>> parseCsv(String content) {
        List<List<String>> rows = new ArrayList<>();
        List<String> row = new ArrayList<>();
        StringBuilder value = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < content.length(); i++) {
            char c = content.charAt(i);
            if (c == '"') {
                if (inQuotes && i + 1 < content.length() && content.charAt(i + 1) == '"') { value.append('"'); i++; }
                else inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                row.add(value.toString());
                value.setLength(0);
            } else if (c == '\n' && !inQuotes) {
                row.add(stripCr(value.toString()));
                if (row.stream().anyMatch(f -> !f.isBlank())) rows.add(row);
                row = new ArrayList<>();
                value.setLength(0);
            } else {
                value.append(c);
            }
        }
        row.add(stripCr(value.toString()));
        if (row.stream().anyMatch(f -> !f.isBlank())) rows.add(row);
        return rows;
    }

    private static String stripCr(String s) { return s.endsWith("\r") ? s.substring(0, s.length() - 1) : s; }

    /** JS Number.parseFloat: parses the numeric prefix, NaN otherwise. */
    private static double parseFloat(String s) {
        Matcher m = FLOAT_PREFIX.matcher(s == null ? "" : s);
        return m.find() ? Double.parseDouble(m.group().trim()) : Double.NaN;
    }

    private static Map<String, Object> toCatalogProduct(List<String> f) {
        // Some rows contain unquoted commas in the quantity; the last five fields are reliable.
        if (f.size() < 9) return null;
        String index = f.get(0), brand = f.get(1), productName = f.get(2);
        List<String> tail = f.subList(f.size() - 5, f.size());
        String price = tail.get(0), mrp = tail.get(1), category = tail.get(2), subCategory = tail.get(3), image = tail.get(4);
        String quantity = String.join(",", f.subList(3, f.size() - 5)).trim();
        double numericPrice = parseFloat(price);
        if (index.isEmpty() || productName.isEmpty() || Double.isNaN(numericPrice) || Double.isInfinite(numericPrice)) return null;

        double mrpValue = parseFloat(mrp);
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("_id", "catalog-" + index.trim());
        StringBuilder name = new StringBuilder();
        if (!brand.isEmpty()) name.append(brand).append(" - ");
        name.append(productName);
        p.put("name", name.toString());
        p.put("description", productName + (quantity.isEmpty() ? "" : " (" + quantity + ")"));
        p.put("price", numericPrice);
        p.put("originalPrice", (Double.isNaN(mrpValue) || mrpValue == 0) ? numericPrice : mrpValue);
        p.put("imageUrl", image.isEmpty() ? List.of() : List.of(image.trim()));
        p.put("category", category.trim().isEmpty() ? "Grocery" : category.trim());
        p.put("subCategory", subCategory.trim());
        p.put("quantity", quantity);
        p.put("stock", 100);
        p.put("source", "catalog");
        return p;
    }
}
