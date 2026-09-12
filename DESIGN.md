# Libro Admin UI/UX Design System & Style Guidelines

Tài liệu này tổng hợp toàn bộ các nguyên tắc thiết kế, quy chuẩn giao diện (UI), trải nghiệm người dùng (UX) và các đoạn code mẫu chuẩn cho các trang quản trị (Admin) trong hệ thống **Libro** (như Book Catalog, Book Copies, Authors, Genres/Categories, Loans, v.v.).

Mục đích: Đảm bảo tính nhất quán tuyệt đối giữa các màn hình, không lặp lại các lỗi giao diện đã được điều chỉnh.

---

## 1. Triết lý thiết kế cốt lõi (Core Philosophy)

1. **Tối giản & Thực dụng (Clean & Functional):**
   - Không lạm dụng badge, màu mè, viền dày hoặc hiệu ứng chuyển động không cần thiết.
   - Bảng dữ liệu (Data Table) phải phẳng, thoáng, không dùng khung wrapper thẻ (card) bao ngoài cồng kềnh.
2. **Nhất quán về Bo góc (Border Radius):**
   - **4px – 6px (`rounded-md`)**: Chuẩn chung cho Button, Input, Search Bar, Modal, Checkbox.
   - **2px (`rounded-[2px]`)**: Dành cho bìa sách (Book Covers).
   - **6px – 8px (`rounded-md` / `rounded-lg`)**: Dành cho ảnh tác giả (Avatar). **Tuyệt đối KHÔNG dùng `rounded-full` (hình tròn).**
3. **An toàn & Chuẩn nghiệp vụ (Safe Operations):**
   - Không đặt dropdown đổi trạng thái trực tiếp trong từng dòng của bảng (tránh misclick).
   - Thao tác xóa/cập nhật trạng thái được gom vào menu `Actions` trên Header thông qua Checkbox.

---

## 2. Quy chuẩn Toolbar: Search Bar, Buttons & Filters

### 2.1. Thanh tìm kiếm (Search Bar), Nút Sort & Nút chính (Primary Button)
- **Cụm Search & Sort**: Chiếm **60%** chiều rộng (`w-full sm:w-[60%]`), gồm ô tìm kiếm `flex-1 h-9` kèm **Nút Sort** (`h-9 w-9`, `rounded-md`) dùng icon `IconArrowsUpDown` (`@tabler/icons-react`) ngay bên cạnh.
- **Bo góc**: `rounded-md` (4–6px), không bo tròn kiểu pill.
- **Nút hành động chính (Add Button)**:
  - Chiều cao `h-9 px-4`, font `text-xs font-semibold`, `rounded-md`.
  - Label ngắn gọn, **không kèm icon** (Ví dụ: `Add Book`, `Add Copy`, `Add Author`, `Add Category`).
  - Màu chính: Blue `#066fd1` (`t.primaryBtn`).

```tsx
{/* Search & Actions Toolbar */}
<div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
  <div className="flex items-center gap-2 w-full sm:w-[60%]">
    <div className="relative flex-1">
      <IconSearch size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
      <input
        placeholder="Search..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        className={`h-9 pl-9 pr-3 text-xs w-full rounded-md border outline-none transition ${t.inputBg}`}
      />
    </div>

    {/* Sort Dropdown Button */}
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`h-9 w-9 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
            sortBy !== 'default'
              ? isDark ? 'bg-[#252a34] border-blue-500/50 text-blue-400' : 'bg-blue-50 border-blue-300 text-blue-600'
              : isDark ? 'bg-[#181a20] border-[#2c323e] text-[#cbd2de] hover:text-white hover:border-[#4d576a] hover:bg-[#20242c]' : 'bg-white border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50'
          }`}
          title="Sort options"
        >
          <IconArrowsUpDown size={15} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setSortBy('default')}>Default</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setSortBy('title-asc')}>Title (A-Z)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setSortBy('title-desc')}>Title (Z-A)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>

  <div className="flex items-center gap-2 shrink-0 justify-end">
    <button
      onClick={() => navigate('/admin/books/new')}
      className={`h-9 px-4 text-xs font-semibold rounded-md transition-all cursor-pointer ${t.primaryBtn}`}
    >
      Add Book
    </button>
  </div>
</div>
```

- **Thao tác Thêm mới (Create Flow)**: Với các thực thể nhiều trường dữ liệu phức tạp như Book, **chuyển hướng trực tiếp tới trang tạo mới toàn màn hình (`/admin/books/new`)** thay vì dùng modal chật hẹp, áp dụng trọn vẹn bố cục 2 cột (Content-First + Media & Status) của trang Detail.

### 2.2. Khu vực lọc (Filter Section) & Quy tắc Chọn Component Lọc (Select vs Searchable Combobox)
- Nằm ngay dưới Search Bar, gồm huy hiệu Filter (`IconFilter2`, `rounded-md`), các hộp lọc nhỏ gọn `h-9 text-xs sm:text-[13px]`, nút thêm filter `+` và nút `Reset` dạng text link xanh.

> [!IMPORTANT]
> **QUY CHUẨN HIỂN THỊ & CẤU TRÚC HỘP LỌC (Filter Box UI & Component Rules):**
> 1. **Hiển thị đầy đủ nội dung & Tự động giãn theo nội dung (Fit Content / No Truncation / No `...`)**:
>    - Nhãn filter trên ô kích hoạt và từng tùy chọn trong popover dropdown phải hiển thị trọn vẹn (`whitespace-nowrap`), **tuyệt đối không cắt cụt bằng dấu `...`**.
>    - Popover combobox tự động fit theo độ dài của tên sách / mục dữ liệu (`w-max min-w-[260px] max-w-[500px]`).
> 2. **Ẩn Chevron Down khi có giá trị / Chỉ hiện nút `x` (Chevron vs X Toggle)**:
>    - Khi filter đang ở trạng thái mặc định (chưa chọn / `All`): Hiển thị icon `IconChevronDown` (mũi tên trỏ xuống).
>    - Khi filter **đang có giá trị được chọn**: **ẨN HOÀN TOÀN** icon Chevron Down và **CHỈ HIỂN THỊ** duy nhất nút xóa `x` (`IconX`) ở góc phải bên trong hộp filter. Tuyệt đối không để cả 2 icon xuất hiện cùng lúc.
> 3. **Hỗ trợ Multi-Select với Checkboxes (Searchable Combobox)**:
>    - Trong `<AdminFilterCombobox>`: Tích hợp ô tích `Checkbox` cạnh mỗi tùy chọn, cho phép chọn nhiều giá trị cùng lúc kèm thanh tìm kiếm tức thời.
> 4. **Phân loại Component Lọc**:
>    - **Enum tĩnh, ít giá trị** (`Format`, `Status`): Dùng `<AdminFilterSelect>`.
>    - **Dữ liệu động / Nhiều giá trị** (`Genre`, `Book Title`, `Author`, `Publisher`, `Location`, `Member`): **BẮT BUỘC DÙNG** Searchable Combobox (`<AdminFilterCombobox>`) tích hợp checkbox và ô tìm kiếm tức thời.

```tsx
{/* 1. Static Enum Filter -> Dùng AdminFilterSelect */}
<AdminFilterSelect
  label="Format"
  value={formatFilter}
  options={[
    { value: 'PAPERBACK', label: 'Paperback' },
    { value: 'HARDCOVER', label: 'Hardcover' },
    { value: 'EBOOK', label: 'E-Book' },
    { value: 'AUDIOBOOK', label: 'Audiobook' },
  ]}
  onChange={(val) => setFormatFilter(val as BookFormat)}
  onRemove={() => removeFilterField('format')}
  allLabel="All Formats"
/>

{/* 2. Dynamic / Multi-value Filter -> Dùng Searchable Combobox với Checkbox */}
<AdminFilterCombobox
  label="Genre"
  value={genreFilter}
  options={genres.map((g) => ({ value: g.handle, label: g.name }))}
  onChange={(val) => setGenreFilter(Array.isArray(val) ? val : val ? [val] : [])}
  onRemove={() => removeFilterField('genre')}
  multiple={true}
  placeholder="Search genre..."
/>
```

### 2.3. Đồng bộ Trạng thái Tìm kiếm & Lọc với URL (URL Search Parameters Sync)
> [!IMPORTANT]
> **QUY CHUẨN ĐỒNG BỘ TRÌNH DUYỆT (Browser URL Sync):**
> - Mọi trang danh sách/bảng Admin (`BookCatalogPage`, `BookCopiesPage`, `AdminAuthorsPage`, `AdminGenresPage`, v.v.) **bắt buộc đồng bộ** từ khóa tìm kiếm (`search`), kiểu sắp xếp (`sort`) và các bộ lọc đang kích hoạt (`status`, `format`, `genre`, v.v.) vào URL query string thông qua hook `useSearchParams` (`react-router-dom`).
> - **Chế độ replace**: Sử dụng `setSearchParams(params, { replace: true })` để không làm rối loạn lịch sử Back/Forward của trình duyệt khi người dùng gõ phím hoặc tích chọn filter.
> - **Trải nghiệm**: Cho phép người dùng Reload (F5), Bookmark hoặc chia sẻ trực tiếp liên kết URL kèm toàn bộ trạng thái tìm kiếm/lọc hiện tại.

```tsx
const [searchParams, setSearchParams] = useSearchParams()

// 1. Khởi tạo State từ URL Search Params
const initialKeyword = searchParams.get('search') || ''
const initialSort = searchParams.get('sort') || 'default'
const initialStatus = searchParams.get('status') || ''

const [keyword, setKeyword] = useState(initialKeyword)
const [sortBy, setSortBy] = useState(initialSort)
const [statusFilter, setStatusFilter] = useState(initialStatus)

// 2. Tự động đồng bộ State lên URL khi có thay đổi
useEffect(() => {
  const params = new URLSearchParams()
  if (keyword.trim()) params.set('search', keyword.trim())
  if (sortBy && sortBy !== 'default') params.set('sort', sortBy)
  if (statusFilter) params.set('status', statusFilter)
  setSearchParams(params, { replace: true })
}, [keyword, sortBy, statusFilter, setSearchParams])
```

---

## 3. Quy chuẩn Bảng dữ liệu (Data Tables)

### 3.1. Cột Checkbox & Bulk Actions (Thay thế hoàn toàn cột `#` thứ tự)
- **Cột đầu tiên**: Luôn là `Checkbox` (chiều rộng cố định `w-10 px-3 text-center align-middle`).
- **Header Checkbox**: Hỗ trợ chọn tất cả / trạng thái `indeterminate`.
- **Cột thứ hai (Header)**:
  - Khi chưa chọn: Hiển thị tên cột bình thường (VD: `BOOK`, `BARCODE`, `AUTHOR NAME`).
  - Khi đã chọn `>= 1` dòng: Hiển thị `{N} selected` + Dropdown menu `Actions` (Thực hiện thao tác hàng loạt: Xóa, Đổi trạng thái, Bỏ chọn).
- **Checkbox trên từng dòng**: Cần có `onClick={(e) => e.stopPropagation()}` để không kích hoạt sự kiện click dòng.

```tsx
<th className="w-10 px-3 text-center align-middle">
  <Checkbox
    checked={
      items.length > 0 && selectedIds.length === items.length
        ? true
        : selectedIds.length > 0
        ? 'indeterminate'
        : false
    }
    onCheckedChange={toggleSelectAll}
    className={isDark ? '!border-[#3e4756] hover:!border-[#5a667b]' : '!border-gray-400 hover:!border-gray-500'}
  />
</th>
<th className="px-4 text-left align-middle min-w-[200px]">
  {selectedIds.length > 0 ? (
    <div className="flex items-center gap-2.5">
      <span className={`text-xs font-semibold normal-case whitespace-nowrap ${t.titleColor}`}>
        {selectedIds.length} selected
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className={`h-6 px-2 rounded-md border text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer select-none normal-case whitespace-nowrap ${
            isDark ? 'bg-[#181a20] border-[#3e4756] text-[#cbd2de] hover:text-white' : 'bg-white border-gray-300 text-gray-700 hover:text-gray-900'
          }`}>
            <span>Actions</span>
            <IconChevronDown size={12} className="opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => handleBulkUpdateStatus('AVAILABLE')}>Mark as Available</DropdownMenuItem>
          <DropdownMenuItem onClick={handleBulkDelete} className="text-rose-500 focus:text-rose-400">
            Remove Selected ({selectedIds.length})
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSelectedIds([])}>Deselect all</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ) : (
    <span className={`text-xs font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
      Barcode
    </span>
  )}
</th>
```

### 3.2. Tiêu đề cột bảng (Table Header Typography & Casing)
> [!IMPORTANT]
> **TIÊU ĐỀ CỘT DÙNG PASCAL CASE / TITLE CASE (Viết hoa chữ cái đầu mỗi từ)**
> - **TUYỆT ĐỐI KHÔNG VIẾT HOA TOÀN BỘ (NO ALL-CAPS / UPPERCASE)**.
> - **Không sử dụng** class `uppercase` và `tracking-wider` trong `<th>` hoặc header span.
> - **Typography chuẩn**: `text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`.
> - **Ví dụ chuẩn**: `Book`, `Barcode`, `ISBN`, `Location`, `Last Borrowed`, `Status`, `Category Name`, `Author Name`, `Books`, `Assigned Role`.

### 3.3. Hiển thị dữ liệu trong dòng (Typography & Spacing Scale)
> [!IMPORTANT]
> **QUY CHUẨN TYPOGRAPHY & ĐỘ CAO DÒNG BẢNG (Tối ưu cho màn hình 24"-27" và Laptop)**:
> - **Padding dòng bảng**: Chuẩn `py-3 px-4` giúp bảng thoáng đãng, dễ quét thông tin trên màn hình lớn.
> - **Tên sách / Thực thể chính (Book Title, Author Name, Genre Name)**: `text-sm font-medium ${t.titleColor}` (14px).
> - **Tác giả phụ / Subtext**: `text-xs ${isDark ? 'text-[#8c94a5]' : 'text-gray-500'}` (12px).
> - **Định dạng / Format**: `text-sm font-normal ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}` (VD: `PAPERBACK`).
> - **Barcode & Status Badge**: Barcode `font-mono text-sm font-semibold` + Inline status badge `text-[11px] font-mono px-2 py-0.5 rounded border uppercase`.
> - **Số lượng sách / Book count & Bản sao (Copies)**: `text-sm font-mono` (VD: `5` hoặc `3 / 3`).
> - **Mã ISBN & Ngày tháng (Last Borrowed)**: `text-xs font-mono` (VD: `2024-09-11` hoặc `—` nếu chưa có). Cột ngày nằm cuối bảng và được căn phải (`text-right`).

### 3.4. Không dùng nút hành động khi Hover dòng (No Hover Actions)
- Toàn bộ dòng trong bảng có hiệu ứng hover đổi màu nền nhẹ và toàn dòng có thể click (`cursor-pointer`) để chuyển vào trang chi tiết.
- **Không đặt** các nút `Edit`, `Delete` ẩn hiện khi hover (`opacity-0 group-hover:opacity-100`) trên các ô của bảng.

### 3.5. Tránh trùng lặp cột (No Redundant Columns)
- Không tạo 2 cột có cùng mục đích (Ví dụ: Không để cả cột text `Status` và cột dropdown `Update Condition`; không để cột `Format` trên trang bản sao khi thông tin này đã nằm ở card tóm tắt đầu trang).

---

## 4. Hình ảnh & Avatar (Images & Avatars)

| Loại ảnh | Kích thước | Bo góc (Border Radius) | Quy cách |
| :--- | :--- | :--- | :--- |
| **Bìa sách (Book Cover)** | `w-9 h-12` (Bảng) / `w-10 h-14` (Header) | `rounded-[2px]` | `object-cover`, viền mỏng `border-gray-300 dark:border-[#2c323e]` |
| **Ảnh tác giả (Author Avatar)** | `w-9 h-9` (Bảng) / `w-14 h-14` (Form) | `rounded-md` (4px - 6px) | `object-cover`, **KHÔNG dùng `rounded-full`**. Monogram ký tự đầu cũng dùng `rounded-md`. |

---

## 5. Bảng mã màu & Theme Tokens (Light / Dark Theme)

### Dark Theme (`isDark = true`)
- Nền trang / Background: `#16181d`
- Nền Card / Modal: `#1a1d24` / `#1c2027`
- Viền bảng / Table Borders: `border-[#22262e]` (head), `border-[#20242c]` (row)
- Hàng được chọn / Selected Row: `bg-[#1e232b]`
- Màu chữ chính / Title: `#cbd2de` / `text-white`
- Màu chữ phụ / Subtext: `#8c94a5`
- Input / Search: `bg-[#13161a] border-[#2c323e] text-[#cbd2de]`

### Light Theme (`isDark = false`)
- Nền trang / Background: `#fafafa`
- Nền Card / Modal: `#ffffff`
- Viền bảng / Table Borders: `border-gray-200`
- Hàng được chọn / Selected Row: `bg-blue-50/60`
- Màu chữ chính / Title: `text-gray-900`
- Màu chữ phụ / Subtext: `text-gray-600` (đảm bảo độ tương phản chuẩn WCAG)
- Input / Search: `bg-white border-gray-300 text-gray-900`

---

## 6. Quy chuẩn Trang Chi tiết Quản trị (Admin Detail Pages: Book, Author, Genre)

> [!IMPORTANT]
> **QUY TẮC BỐ CỤC TRANG CHI TIẾT (Detail Page Layout Guidelines):**
> 1. **Thanh Sub-Navigation & Top Action Bar**:
>    - Nằm ở trên cùng với đường viền dưới (`border-b pb-2`).
>    - Bên trái: Các tab liên kết (`Book Details`, `Author Details`, `Genre Details` & `Books ({count})` / `Copies ({count})`).
>    - Bên phải: Nút `Save Changes` (chỉ kích hoạt khi có thay đổi `isDirty`), liên kết `Public` và nút xóa `Delete` / `Archive`.
> 2. **Bố cục Form 2 Cột Chuẩn Tỉ Lệ 8/12 & 4/12 (`grid grid-cols-1 lg:grid-cols-12 gap-y-6 lg:gap-0`)**:
>    - **Cột trái (8/12 - `lg:col-span-8 space-y-4 w-full lg:max-w-[90%] min-w-0`) - Thứ tự ưu tiên Content-First (Mỗi trường 1 dòng riêng biệt)**:
>      - Các ô nhập liệu chiếm **90% bề ngang của cột 8/12 (`lg:max-w-[90%]`)**, 10% còn lại đóng vai trò là khoảng đệm ngăn cách tự nhiên giữa hai cột.
>      1. `Title` (1 dòng)
>      2. `Authors` (1 dòng)
>      3. `Description / Synopsis` (`AdminRichTextEditor`, 1 dòng) - đặt ngay dưới Title & Authors ở tầm mắt nhìn chính, ngang hàng với ảnh Media bên phải.
>      4. `Publisher` (1 dòng)
>      5. `Publication Year` (1 dòng)
>      6. `ISBN` (1 dòng)
>      7. `Format / Binding` (1 dòng)
>      8. `Edition` (1 dòng)
>      9. `Page Count` (1 dòng)
>      10. `Language` (1 dòng)
>      - **Bỏ qua trường Slug/Handle thủ công** (hệ thống tự động sinh và quản lý ngầm).
>    - **Cột phải (4/12 - `lg:col-span-4 space-y-4 w-full lg:max-w-[280px]`)**:
>      1. **Status Control (Linear/Stripe Dot + Toggle Switch Style)**: Đặt ở đầu cột phải, label có `<IconWorld size={14} /> Status`, bên trong hiển thị chấm tròn trạng thái (Status dot: `bg-emerald-500` cho `Published`/`Active`, `bg-gray-400` cho `Draft`/`Inactive`) kết hợp nhãn trạng thái và Toggle Switch mượt mà ở góc phải (`w-full`).
>      2. **Media / Bìa sách / Avatar / Card biểu tượng**: Kích thước mở rộng vừa vặn theo cột phải `w-full` (`aspect-[2/3]` với bìa sách, `aspect-square` với avatar tác giả, `aspect-[4/3]` với category card) kèm lớp phủ hover (`IconEye` preview, `IconPhotoEdit` sửa URL).
>      3. **Phân loại (Taxonomy)**: Genres (combobox chọn thể loại dạng chip bên dưới ở Book Detail).
>    - **Khoảng cách giữa hai cột**: Container lưới đặt `lg:gap-0`, khoảng trống được tạo bởi chính giới hạn `lg:max-w-[90%]` của cột trái.
> 3. **Danh sách sách liên kết bên dưới (Linked Books Section)**:
>    - Dạng danh sách gọn gàng (Cover + Title + Year) hoặc bảng Frameless Table, trực quan và tối giản.

```tsx
<div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-2 ${isDark ? 'border-[#22262e]' : 'border-gray-200'}`}>
  <div className="flex items-center gap-1">
    <Link
      to={`/admin/authors/${author.id}`}
      className={`px-3.5 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
        isDark ? 'bg-[#252a34] text-white border-[#333a48]' : 'bg-gray-100 text-gray-900 border-gray-300'
      }`}
    >
      Author Details
    </Link>
    <a
      href="#books-section"
      className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
        isDark ? 'text-[#8c94a5] hover:text-white hover:bg-[#1f2228]' : 'text-gray-600 hover:text-gray-950 hover:bg-gray-100'
      }`}
    >
      Books ({books.length})
    </a>
  </div>

  <div className="flex items-center gap-2">
    {isDirty && (
      <button
        type="button"
        onClick={handleSave}
        className={`h-8 px-3.5 text-xs font-semibold rounded-md inline-flex items-center transition-all cursor-pointer ${t.primaryBtn}`}
      >
        Save Changes
      </button>
    )}
  </div>
</div>
```

---

## 7. Checklist kiểm tra nhanh khi tạo / chỉnh sửa trang Admin

- [ ] Cụm Search & Sort chiếm **60% width**, gồm ô tìm kiếm và nút sort dùng `IconArrowsUpDown`, bo góc `rounded-md`.
- [ ] Hộp Filter hiển thị **đầy đủ nội dung nhãn/giá trị** (không cắt cụt bằng `...`, không giới hạn `max-w` ngắn).
- [ ] Quy tắc Icon hộp lọc: Khi filter có giá trị được chọn thì **ẩn icon Chevron Down**, chỉ hiển thị duy nhất nút xóa `x` bên trong box. Khi chưa chọn (`All`), hiển thị Chevron Down.
- [ ] Phân loại Filter: Enum tĩnh ít giá trị dùng `<AdminFilterSelect>`, dữ liệu động / nhiều giá trị (`Genre`, `Author`, v.v.) **BẮT BUỘC** dùng Combobox có Search & Checkbox multi-select (`<AdminFilterCombobox>`).
- [ ] Đồng bộ URL: Trạng thái tìm kiếm (`search`), sắp xếp (`sort`) và các bộ lọc (`status`, `format`, `genre`) được **đồng bộ vào URL search params** (`useSearchParams` with `{ replace: true }`).
- [ ] Button thêm mới có label rõ ràng (`Add Book`, `Add Author`), không chứa icon thừa, bo góc `rounded-md`.
- [ ] Bảng không có cột số thứ tự `#`; thay bằng cột **Checkbox**.
- [ ] Header bảng có Dropdown **Actions** khi tích chọn >= 1 dòng.
- [ ] Tiêu đề cột bảng (Table Headers) dùng **Pascal Case / Title Case** (không dùng `uppercase`, không `tracking-wider`).
- [ ] Typography chuẩn: Tên thực thể chính/dữ liệu chuẩn dùng `text-sm` (14px), header bảng dùng `text-[13px] font-semibold`, subtext/meta dùng `text-xs` (12px), dòng bảng đệm `py-3 px-4`.
- [ ] Toàn bộ giá trị trong ô (Status, Format, Count, ISBN) là **Plain Text**, không bọc trong Badge.
- [ ] Không có nút `Edit`/`Delete` ẩn hiện khi hover trên dòng.
- [ ] Không có dropdown đổi status trực tiếp trong dòng bảng.
- [ ] Ảnh bìa sách bo góc `rounded-[2px]`, ảnh tác giả bo góc `rounded-md` (không dùng hình tròn).
- [ ] Không có icon trang trí thừa (`IconBarcode`, `IconTags`) chèn trước text trong ô dữ liệu.
- [ ] Màu sắc hiển thị chuẩn xác và có độ tương phản cao ở cả Light Theme và Dark Theme.

---

## 8. Quy chuẩn Quản lý Bản sao & Quầy Lưu Thông (Web-first Flow)

### 8.1. Nhập bản sao sách vào kho (Add Copies Modal)
- **Đầu sách / ISBN**: Tìm kiếm và chọn bằng `<AdminCombobox>` hỗ trợ gõ tìm theo **ISBN** hoặc **Tên sách**.
- **Số lượng nhập (Quantity)**: Cho phép nhập số lượng bản sao cần nhập kho (ví dụ: 1, 5, 10 cuốn). Hệ thống tự động cấp phát mã định danh duy nhất (Code 128 `BC...`) cho từng cuốn sách.
- **Vị trí kệ (Location)**: Nhập vị trí kệ cất sách (ví dụ: `Shelf A-1`, `Kho tầng 2`).

### 8.2. Mượn sách tại quầy (Circulation Desk Checkout)
1. **Độc giả mượn sách**: Tìm kiếm theo Email, Tên, Username hoặc SĐT qua `<AdminCombobox>`.
2. **Chọn sách cho mượn**: Tìm kiếm theo **ISBN, Tên sách hoặc Mã vạch** qua `<AdminCombobox>`, hệ thống hiển thị **Preview Card** (Tên sách, ảnh bìa, mã vạch, vị trí, trạng thái khả dụng) để thủ thư đối chiếu.
3. **Thời hạn mượn**: Tự động tính hạn trả (+14 ngày theo cấu hình lưu thông).
4. **Xác nhận**: Bấm nút `Xác nhận mượn sách` để phát hành phiếu mượn.
