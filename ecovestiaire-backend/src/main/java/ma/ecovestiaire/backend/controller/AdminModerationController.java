package ma.ecovestiaire.backend.controller;



import ma.ecovestiaire.backend.repository.CommentRepository;

import ma.ecovestiaire.backend.repository.ItemRepository;

import ma.ecovestiaire.backend.dto.CategoryResponse;

import ma.ecovestiaire.backend.dto.CommentResponse;

import ma.ecovestiaire.backend.dto.ItemResponse;

import ma.ecovestiaire.backend.service.CategoryService;

import ma.ecovestiaire.backend.service.CommentService;

import ma.ecovestiaire.backend.service.ItemService;
import ma.ecovestiaire.backend.service.OrderService;
import ma.ecovestiaire.backend.dto.OrderResponse;

import org.springframework.data.domain.Page;

import org.springframework.data.domain.PageRequest;

import org.springframework.data.domain.Sort;

import org.springframework.data.repository.query.Param;

import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;



import java.util.List;



@RestController

@RequestMapping("/admin")

public class AdminModerationController {



    private final ItemRepository itemRepository;

    private final CommentRepository commentRepository;

    private final ItemService itemService;

    private final CommentService commentService;

    private final CategoryService categoryService;
    private final OrderService orderService;



    public AdminModerationController(ItemRepository itemRepository,
                                     CommentRepository commentRepository,
                                     ItemService itemService,
                                     CommentService commentService,
                                     CategoryService categoryService,
                                     OrderService orderService) {
        this.itemRepository = itemRepository;
        this.commentRepository = commentRepository;
        this.itemService = itemService;
        this.commentService = commentService;
        this.categoryService = categoryService;
        this.orderService = orderService;
    }



    // GET /admin/items

    @GetMapping("/items")

    public ResponseEntity<Page<ItemResponse>> getItems(

            @RequestParam(name = "page", defaultValue = "0") int page,

            @RequestParam(name = "size", defaultValue = "20") int size

    ) {

        return ResponseEntity.ok(itemService.getAllItems(PageRequest.of(page, size)));

    }



    // GET /admin/comments

    @GetMapping("/comments")

    public ResponseEntity<Page<CommentResponse>> getComments(

            @RequestParam(name = "reportedOnly", defaultValue = "false") boolean reportedOnly,

            @RequestParam(name = "q", required = false) String query,

            @RequestParam(name = "page", defaultValue = "0") int page,

            @RequestParam(name = "size", defaultValue = "20") int size,

            @RequestParam(name = "sort", defaultValue = "createdAt,desc") String sort

    ) {

        String[] sortParams = sort.split(",");

        Sort sortObj = Sort.by(sortParams[1].equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC, sortParams[0]);

        

        return ResponseEntity.ok(commentService.getAllComments(reportedOnly, query, PageRequest.of(page, size, sortObj)));

    }



    // GET /admin/categories

    @GetMapping("/categories")

    public ResponseEntity<List<CategoryResponse>> getCategories() {

        return ResponseEntity.ok(categoryService.getAllCategories());

    }



    // DELETE /api/admin/items/{id}

    @DeleteMapping("/items/{id}")

    public ResponseEntity<Void> deleteItem(@PathVariable("id") Long itemId) {

        if (!itemRepository.existsById(itemId)) {

            return ResponseEntity.notFound().build();

        }

        itemService.deleteItem(itemId);

        return ResponseEntity.noContent().build();

    }



    // DELETE /api/admin/comments/{id}

    @DeleteMapping("/comments/{id}")

    public ResponseEntity<Void> deleteComment(@PathVariable("id") Long commentId) {

        if (!commentRepository.existsById(commentId)) {

            return ResponseEntity.notFound().build();

        }

        commentService.deleteComment(commentId);

        return ResponseEntity.noContent().build();

    }



    // POST /admin/comments/{id}/report

    @PostMapping("/comments/{id}/report")

    public ResponseEntity<Void> reportComment(@PathVariable("id") Long commentId) {

        commentService.reportComment(commentId);

        return ResponseEntity.ok().build();
    }

    // GET /admin/orders
    @GetMapping("/orders")
    public ResponseEntity<Page<OrderResponse>> getAllOrders(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "sort", defaultValue = "createdAt,desc") String sort
    ) {
        String[] sortParams = sort.split(",");
        Sort sortObj = Sort.by(sortParams[1].equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC, sortParams[0]);
        return ResponseEntity.ok(orderService.getAllOrders(PageRequest.of(page, size, sortObj)));
    }

    // PUT /admin/orders/{id}/status
    @PutMapping("/orders/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable("id") Long orderId,
            @RequestBody java.util.Map<String, String> body) {
        String status = body.get("status");
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(orderService.updateOrderStatus(orderId, status));
    }
}