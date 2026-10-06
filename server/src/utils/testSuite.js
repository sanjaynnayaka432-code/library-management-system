const BASE_URL = 'http://localhost:5001/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('🚀 [LibraX Test Suite] Running End-to-End API Tests');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    console.log('[1] Testing Health Endpoint');
    const health = await request('/health');
    assert(health.status === 200 && health.data.status === 'online', 'Server health check is online');

    // 2. Admin Login
    console.log('\n[2] Testing Admin Authentication');
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@librax.com',
        password: 'Admin@123',
      }),
    });
    assert(adminLogin.data?.success === true, 'Admin login succeeded');
    const adminToken = adminLogin.data.token;
    assert(adminLogin.data.user.role === 'ADMIN', 'Admin role verified in token response');

    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // 3. Student Login
    console.log('\n[3] Testing Student Authentication');
    const studentLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'sarah.j@student.edu',
        password: 'Student@123',
      }),
    });
    assert(studentLogin.data?.success === true, 'Student login succeeded');
    const studentToken = studentLogin.data.token;
    const studentHeaders = { Authorization: `Bearer ${studentToken}` };

    // 4. Admin Dashboard Stats
    console.log('\n[4] Testing Admin Dashboard Stats');
    const dash = await request('/dashboard/stats', { headers: adminHeaders });
    assert(dash.data?.success === true, 'Admin stats retrieved successfully');
    assert(dash.data.stats.totalBooks > 0, `Total books count: ${dash.data.stats.totalBooks}`);
    assert(dash.data.stats.totalStudents > 0, `Total students count: ${dash.data.stats.totalStudents}`);

    // 5. Student Dashboard Stats
    console.log('\n[5] Testing Student Dashboard Stats');
    const studentDash = await request('/dashboard/stats', { headers: studentHeaders });
    assert(studentDash.data?.success === true, 'Student stats retrieved successfully');
    assert(studentDash.data.role === 'STUDENT', 'Correct student role in stats');

    // 6. Books Listing & Filter
    console.log('\n[6] Testing Book Catalog Search & Filtering');
    const books = await request('/books?search=Clean&limit=5');
    assert(books.data?.success === true, 'Books catalog query returned');
    assert(books.data.books.length > 0, `Found ${books.data.books.length} books matching query`);

    // 7. Book QR Code Generation
    console.log('\n[7] Testing Book QR Code Endpoint');
    const bookId = books.data.books[0].id;
    const qr = await request(`/books/${bookId}/qrcode`);
    assert(qr.data?.success === true, 'QR code generated for book');
    assert(qr.data.qrCodeUrl.startsWith('data:image/png;base64,'), 'QR code is valid base64 PNG data URL');

    // 8. Role-Based Route Protection (Student trying to create book)
    console.log('\n[8] Testing Role Authorization Restrictions');
    const forbiddenRes = await request('/books', {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({
        title: 'Unauthorized Book',
        isbn: '9999999999999',
        author: 'Hacker',
        category_id: 1,
        total_copies: 1,
      }),
    });
    assert(forbiddenRes.status === 403, 'Forbidden 403 correctly returned for unauthorized student action');

    // 9. Create New Book (Admin)
    console.log('\n[9] Testing Admin Book Creation');
    const testIsbn = `TEST-${Date.now().toString().slice(-8)}`;
    const newBook = await request('/books', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        title: 'Mastering Modern Full-Stack Systems',
        isbn: testIsbn,
        author: 'Ada Lovelace & Team',
        publisher: 'Tech Press',
        publication_year: 2026,
        category_id: 1,
        total_copies: 5,
        shelf_location: 'Bay 7, Shelf C1',
        description: 'Comprehensive guide to building resilient distributed applications.',
      }),
    });
    assert(newBook.status === 201, 'Book created with 201 Created');
    const createdBookId = newBook.data.book.id;

    // 10. Issue Book to Student
    console.log('\n[10] Testing Issue Book Workflow');
    const studentId = studentLogin.data.user.id;
    const issue = await request('/transactions/issue', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        userId: studentId,
        bookId: createdBookId,
      }),
    });
    assert(issue.status === 201, `Book issued successfully (Tx ID: ${issue.data.transactionId})`);
    const transactionId = issue.data.transactionId;

    // Verify copies decremented
    const bookCheck = await request(`/books/${createdBookId}`);
    assert(bookCheck.data.book.available_copies === 4, 'Available copies decremented from 5 to 4');

    // 11. Return Book & Overdue Fine calculation
    console.log('\n[11] Testing Return Book Workflow');
    const ret = await request('/transactions/return', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        transactionId: transactionId,
        returnDate: new Date().toISOString().split('T')[0],
      }),
    });
    assert(ret.status === 200, 'Book returned successfully');

    // Verify copies incremented back
    const bookCheckAfterReturn = await request(`/books/${createdBookId}`);
    assert(bookCheckAfterReturn.data.book.available_copies === 5, 'Available copies restored to 5');

    // 12. Cleanup created test book
    console.log('\n[12] Testing Book Deletion');
    const del = await request(`/books/${createdBookId}`, {
      method: 'DELETE',
      headers: adminHeaders,
    });
    assert(del.data?.success === true, 'Test book cleaned up and deleted');

    // 13. System Settings
    console.log('\n[13] Testing System Settings');
    const settings = await request('/settings', { headers: adminHeaders });
    assert(settings.data?.success === true, 'Circulation settings retrieved');
    assert(settings.data.settings.borrowing_period_days !== undefined, 'Borrowing period configured');

    console.log('\n====================================================');
    console.log(`🏁 [Test Suite Complete] Passed: ${passed} | Failed: ${failed}`);
    console.log('====================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Unexpected Error during test execution:', error.message);
    process.exit(1);
  }
}

runTestSuite();
