package ma.ecovestiaire.backend.service;

import ma.ecovestiaire.backend.dto.CommentResponse;
import ma.ecovestiaire.backend.dto.CreateCommentRequest;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CommentService {

    CommentResponse addCommentToItem(Long itemId, CreateCommentRequest request);

    List<CommentResponse> getCommentsForItem(Long itemId);

    Page<CommentResponse> getAllComments(Pageable pageable);

    Page<CommentResponse> getAllComments(boolean reportedOnly, String query, Pageable pageable);

    void reportComment(Long commentId);

    void deleteComment(Long commentId);
}