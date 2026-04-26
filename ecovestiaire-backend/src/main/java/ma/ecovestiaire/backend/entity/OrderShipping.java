package ma.ecovestiaire.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Embeddable
public class OrderShipping {

    @Column(length = 100)
    private String firstName;

    @Column(length = 100)
    private String lastName;

    @Column(length = 255)
    private String address1;

    @Column(length = 100)
    private String city;

    @Column(length = 30)
    private String zip;

    @Column(length = 100)
    private String country;

    @Column(length = 30)
    private String phone;
}
