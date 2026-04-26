package ma.ecovestiaire.backend.mapper;

import ma.ecovestiaire.backend.dto.CommentResponse;
import ma.ecovestiaire.backend.entity.Comment;
import ma.ecovestiaire.backend.entity.Item;
import ma.ecovestiaire.backend.entity.User;
import org.springframework.stereotype.Component;

@Component
public class CommentMapper {

    public Comment toEntity(String content, Item item, User author) {
        return Comment.builder()
                .content(content)
                .item(item)
                .user(author)
                .reported(false)
                .reportCount(0)
                .build();
    }

    public CommentResponse toDto(Comment comment) {
        if (comment == null) {
            return null;
        }
        CommentResponse dto = new CommentResponse();
        dto.setId(comment.getId());
        dto.setContent(comment.getContent());
        dto.setCreatedAt(comment.getCreatedAt());
        dto.setReported(comment.isReported());
        dto.setReportCount(comment.getReportCount());

        User author = comment.getUser();
        if (author != null) {
            dto.setAuthorId(author.getId());
            dto.setAuthorFirstName(author.getFirstName());
            dto.setAuthorLastName(author.getLastName());
            dto.setAuthorProfilePhotoUrl(author.getProfilePhotoUrl());
        }

        Item item = comment.getItem();
        if (item != null) {
            dto.setItemId(item.getId());
            dto.setItemTitle(item.getTitle());
            if (item.getPhotos() != null && !item.getPhotos().isEmpty()) {
                dto.setItemImageUrl(item.getPhotos().get(0));
            }
        }
        
        return dto;
    }
}
