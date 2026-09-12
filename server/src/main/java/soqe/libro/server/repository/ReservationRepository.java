package soqe.libro.server.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import soqe.libro.server.entity.Book;
import soqe.libro.server.entity.Reservation;
import soqe.libro.server.entity.User;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long>, JpaSpecificationExecutor<Reservation> {

    Optional<Reservation> findByReservationCode(String reservationCode);

    boolean existsByReservationCode(String reservationCode);

    Page<Reservation> findByUser(User user, Pageable pageable);

    Page<Reservation> findByUserAndStatus(User user, Reservation.ReservationStatus status, Pageable pageable);

    List<Reservation> findByBookAndStatusOrderByReservedAtAsc(Book book, Reservation.ReservationStatus status);

    List<Reservation> findByStatusAndPickupDeadlineBefore(Reservation.ReservationStatus status, LocalDate deadline);

    long countByUserAndStatusIn(User user, Collection<Reservation.ReservationStatus> statuses);

    boolean existsByUserAndBookAndStatusIn(User user, Book book, Collection<Reservation.ReservationStatus> statuses);

    long countByBookAndStatus(Book book, Reservation.ReservationStatus status);

    long countByStatus(Reservation.ReservationStatus status);
}
