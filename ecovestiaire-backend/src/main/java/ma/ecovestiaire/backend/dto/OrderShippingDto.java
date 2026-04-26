package ma.ecovestiaire.backend.dto;

import lombok.Data;

@Data
public class OrderShippingDto {

    private String firstName;
    private String lastName;
    private String address1;
    private String city;
    private String zip;
    private String country;
    private String phone;
}
