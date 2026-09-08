package soqe.libro.server.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import soqe.libro.server.dto.*;
import soqe.libro.server.entity.Publisher;
import soqe.libro.server.repository.PublisherRepository;
import soqe.libro.server.specification.PublisherSpecification;
import soqe.libro.server.exception.BusinessValidationException;
import soqe.libro.server.exception.ResourceNotFoundException;
import org.springframework.util.StringUtils;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PublisherService {
    private final PublisherRepository repository;

    @Transactional(readOnly = true)
    public Page<PublisherResponse> searchForAdmin(String keyword, Publisher.Status status, Pageable pageable) {
        return repository.findAll(PublisherSpecification.filter(keyword, status), pageable)
                .map(p -> PublisherResponse.builder().id(p.getId()).name(p.getName()).handle(p.getHandle()).address(p.getAddress()).website(p.getWebsite()).status(p.getStatus() != null ? p.getStatus().name() : null).build());
    }

    @Transactional(readOnly = true)
    public PublisherResponse getForAdmin(Long id) {
        Publisher p = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Publisher not found"));
        return PublisherResponse.builder().id(p.getId()).name(p.getName()).handle(p.getHandle()).address(p.getAddress()).website(p.getWebsite()).status(p.getStatus() != null ? p.getStatus().name() : null).build();
    }

    @Transactional
    public PublisherResponse createByAdmin(PublisherCreateRequest req) {
        validateUnique(req.handle(), null);
        Publisher p = Publisher.builder().name(req.name()).handle(req.handle()).address(req.address()).website(req.website()).status(Publisher.Status.ACTIVE).build();
        p = repository.save(p);
        return PublisherResponse.builder().id(p.getId()).name(p.getName()).handle(p.getHandle()).address(p.getAddress()).website(p.getWebsite()).status(p.getStatus().name()).build();
    }

    @Transactional
    public PublisherResponse updateByAdmin(Long id, PublisherUpdateRequest req) {
        Publisher p = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Publisher not found"));
        validateUnique(req.handle(), id);
        p.setName(req.name());
        p.setHandle(req.handle());
        p.setAddress(req.address());
        p.setWebsite(req.website());
        if (req.status() != null) p.setStatus(req.status());
        p = repository.save(p);
        return PublisherResponse.builder().id(p.getId()).name(p.getName()).handle(p.getHandle()).address(p.getAddress()).website(p.getWebsite()).status(p.getStatus().name()).build();
    }

    @Transactional
    public void deleteByAdmin(Long id) {
        Publisher p = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Publisher not found"));
        p.setStatus(Publisher.Status.INACTIVE);
        repository.save(p);
    }

    @Transactional(readOnly = true)
    public Page<PublisherPublicResponse> searchPublic(String keyword, Pageable pageable) {
        return repository.findAll(PublisherSpecification.filter(keyword, Publisher.Status.ACTIVE), pageable)
                .map(p -> PublisherPublicResponse.builder().name(p.getName()).handle(p.getHandle()).address(p.getAddress()).website(p.getWebsite()).build());
    }

    @Transactional(readOnly = true)
    public PublisherPublicResponse getByHandle(String handle) {
        Publisher p = repository.findByHandle(handle).filter(x -> x.getStatus() == Publisher.Status.ACTIVE).orElseThrow(() -> new ResourceNotFoundException("Publisher not found"));
        return PublisherPublicResponse.builder().name(p.getName()).handle(p.getHandle()).address(p.getAddress()).website(p.getWebsite()).build();
    }

    private void validateUnique(String handle, Long excludeId) {
        Map<String, String> errors = new HashMap<>();
        if (StringUtils.hasText(handle)) {
            repository.findByHandle(handle).ifPresent(p -> { if (excludeId == null || !p.getId().equals(excludeId)) errors.put("handle", "Handle is taken"); });
        }
        if (!errors.isEmpty()) throw new BusinessValidationException("Validation failed", errors);
    }
}
