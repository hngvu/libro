package soqe.libro.server.dto;

import lombok.Builder;
import soqe.libro.server.entity.Book;

@Builder
public record BookPublicResponse(
        String title,
        String handle,
        String slug,
        String isbn,
        Integer publicationYear,
        String cover,
        String edition,
        String format,
        String description,
        Integer totalCopies,
        Integer availableCopies
) {
    public static BookPublicResponse from(Book book) {
        return BookPublicResponse.builder()
                .title(book.getTitle())
                .handle(book.getHandle())
                .slug(book.getSlug())
                .isbn(book.getIsbn())
                .publicationYear(book.getPublicationYear())
                .cover(book.getCover())
                .edition(book.getEdition())
                .format(book.getFormat() != null ? book.getFormat().name() : null)
                .description(book.getDescription())
                .totalCopies(book.getTotalCopies())
                .availableCopies(book.getAvailableCopies())
                .build();
    }
}
