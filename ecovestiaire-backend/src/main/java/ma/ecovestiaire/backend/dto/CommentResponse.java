package ma.ecovestiaire.backend.dto;

import lombok.Data;

import java.time.Instant;

@Data
public class CommentResponse {

    private Long id;
    private String content;
    private Instant createdAt;

    private Long authorId;
    private String authorFirstName;
    private String authorLastName;
    private String authorProfilePhotoUrl;

    private Long itemId;
    private String itemTitle;
    private String itemImageUrl;
    private boolean reported;
    private int reportCount;
}