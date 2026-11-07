// =========================================================
// SCHOOL FEE PAYMENT MANAGEMENT SYSTEM - BACKEND API SERVER
// =========================================================
const express = require("express");
const mysql = require("mysql2");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from Public folder
const publicPath = path.join(__dirname, "Public");
app.use(express.static(publicPath));
app.use(express.static(path.join(__dirname, "public")));

// =========================================================
// DATABASE CONFIGURATION & MYSQL CONNECTION
// =========================================================
const DB_HOST = "localhost";
const DB_USER = "root";
const DB_PASSWORD = "manoj123";
const DB_NAME = "school_fee_payment_management_system";

// 1. First ensure the database schema exists
const initConnection = mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD
});

initConnection.connect((err) => {
    if (err) {
        console.error("❌ MySQL Connection Failed:", err.message);
        console.log(`Please verify MySQL is running on "${DB_HOST}" and password is "${DB_PASSWORD}".`);
        return;
    }

    console.log(`✅ Connected to MySQL server on "${DB_HOST}"`);

    // Ensure database exists
    initConnection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`, (createDbErr) => {
        if (createDbErr) {
            console.error("Failed to verify/create database schema:", createDbErr.message);
        } else {
            console.log(`✅ Database schema verified: "${DB_NAME}"`);
        }
        initConnection.end();

        // Initialize tables and seed initial data
        initializeDatabaseTables();
    });
});

// 2. MySQL Connection Pool for handling web requests
const db = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Helper to extract values from multiple possible key names
function getValue(body, ...keys) {
    if (!body) return undefined;
    for (const key of keys) {
        if (body[key] !== undefined && body[key] !== null && body[key] !== "") {
            return body[key];
        }
    }
    return undefined;
}

// Connect to MySQL and initialize tables & sample seed data
function initializeDatabaseTables() {
    db.getConnection((err, conn) => {
        if (err) {
            console.error(`❌ Connection to database "${DB_NAME}" failed:`, err.message);
            return;
        }
        console.log(`✅ Connected to MySQL Database: "${DB_NAME}"`);
        conn.release();

        // 1. Create students table
        const createStudentsTable = `
            CREATE TABLE IF NOT EXISTS students (
                student_id INT AUTO_INCREMENT PRIMARY KEY,
                admission_no VARCHAR(50) NOT NULL UNIQUE,
                student_name VARCHAR(100) NOT NULL,
                class_grade VARCHAR(50) NOT NULL,
                section VARCHAR(20) DEFAULT 'A',
                guardian_name VARCHAR(100) NOT NULL,
                contact_number VARCHAR(20) NOT NULL,
                email VARCHAR(100) DEFAULT '',
                status VARCHAR(30) DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // 2. Create fee_details table
        const createFeeDetailsTable = `
            CREATE TABLE IF NOT EXISTS fee_details (
                fee_id INT AUTO_INCREMENT PRIMARY KEY,
                fee_type VARCHAR(100) NOT NULL,
                class_grade VARCHAR(50) NOT NULL,
                academic_year VARCHAR(50) NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                due_date VARCHAR(50) NOT NULL,
                description VARCHAR(255) DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // 3. Create payments table
        const createPaymentsTable = `
            CREATE TABLE IF NOT EXISTS payments (
                payment_id INT AUTO_INCREMENT PRIMARY KEY,
                receipt_no VARCHAR(50) NOT NULL UNIQUE,
                student_id INT NOT NULL,
                fee_id INT NOT NULL,
                amount_paid DECIMAL(10,2) NOT NULL,
                payment_date VARCHAR(50) NOT NULL,
                payment_mode VARCHAR(50) NOT NULL,
                status VARCHAR(30) DEFAULT 'Paid',
                remarks VARCHAR(255) DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        db.query(createStudentsTable, (err) => {
            if (err) console.error("Error creating students table:", err.message);
            else seedStudents();
        });

        db.query(createFeeDetailsTable, (err) => {
            if (err) console.error("Error creating fee_details table:", err.message);
            else seedFeeDetails();
        });

        db.query(createPaymentsTable, (err) => {
            if (err) console.error("Error creating payments table:", err.message);
            else seedPayments();
        });
    });
}

// Seed Initial Data if empty
function seedStudents() {
    db.query("SELECT COUNT(*) AS count FROM students", (err, res) => {
        if (!err && res[0].count === 0) {
            const sampleStudents = [
                ["ADM-1001", "Aarav Sharma", "Class 10", "A", "Rajesh Sharma", "9876543210", "aarav@school.edu", "Active"],
                ["ADM-1002", "Diya Patel", "Class 10", "B", "Vikram Patel", "9876543211", "diya@school.edu", "Active"],
                ["ADM-1003", "Rohan Verma", "Class 9", "A", "Sunil Verma", "9876543212", "rohan@school.edu", "Active"],
                ["ADM-1004", "Ananya Iyer", "Class 8", "A", "Ramesh Iyer", "9876543213", "ananya@school.edu", "Active"],
                ["ADM-1005", "Mohammed Zaid", "Class 10", "A", "Abdul Zaid", "9876543214", "zaid@school.edu", "Active"],
                ["ADM-1006", "Sneha Reddy", "Class 9", "B", "K. V. Reddy", "9876543215", "sneha@school.edu", "Active"]
            ];
            const sql = "INSERT INTO students (admission_no, student_name, class_grade, section, guardian_name, contact_number, email, status) VALUES ?";
            db.query(sql, [sampleStudents], (insertErr) => {
                if (!insertErr) console.log("Seeded sample students records.");
            });
        }
    });
}

function seedFeeDetails() {
    db.query("SELECT COUNT(*) AS count FROM fee_details", (err, res) => {
        if (!err && res[0].count === 0) {
            const sampleFees = [
                ["Tuition Fee - Term 1", "Class 10", "2026-2027", 25000.00, "2026-11-30", "Semester 1 academic tuition charges"],
                ["Annual Development Fee", "All Classes", "2026-2027", 10000.00, "2026-12-15", "School infrastructure and lab maintenance"],
                ["Transport Bus Fee", "Class 10", "2026-2027", 8500.00, "2026-11-20", "Annual school bus route service"],
                ["Tuition Fee - Term 1", "Class 9", "2026-2027", 22000.00, "2026-11-30", "Semester 1 academic tuition charges"],
                ["Computer & Science Lab Fee", "Class 9", "2026-2027", 5000.00, "2026-11-25", "Laboratory resources and digital learning"],
                ["Tuition Fee - Term 1", "Class 8", "2026-2027", 20000.00, "2026-11-30", "Grade 8 tuition fee"]
            ];
            const sql = "INSERT INTO fee_details (fee_type, class_grade, academic_year, amount, due_date, description) VALUES ?";
            db.query(sql, [sampleFees], (insertErr) => {
                if (!insertErr) console.log("Seeded sample fee_details records.");
            });
        }
    });
}

function seedPayments() {
    db.query("SELECT COUNT(*) AS count FROM payments", (err, res) => {
        if (!err && res[0].count === 0) {
            const samplePayments = [
                ["REC-2026-001", 1, 1, 25000.00, "2026-11-01", "UPI / Online", "Paid", "Paid full tuition via GooglePay"],
                ["REC-2026-002", 2, 1, 15000.00, "2026-11-02", "Net Banking", "Partial", "First installment paid via HDFC"],
                ["REC-2026-003", 3, 4, 22000.00, "2026-11-03", "Credit Card", "Paid", "Paid at fee counter with POS"],
                ["REC-2026-004", 4, 6, 20000.00, "2026-11-04", "Cash", "Paid", "Cash paid at accounts section"],
                ["REC-2026-005", 1, 2, 10000.00, "2026-11-05", "Cheque", "Paid", "Annual fee cheque cleared"]
            ];
            const sql = "INSERT INTO payments (receipt_no, student_id, fee_id, amount_paid, payment_date, payment_mode, status, remarks) VALUES ?";
            db.query(sql, [samplePayments], (insertErr) => {
                if (!insertErr) console.log("Seeded sample payments records.");
            });
        }
    });
}

// =========================================================
// PAGE ROUTING HELPERS (Browser requests deliver HTML pages)
// =========================================================
app.get("/students", (req, res, next) => {
    if (req.accepts("html") && !req.xhr && !req.query.json) {
        return res.sendFile(path.join(publicPath, "students.html"));
    }
    next();
});

app.get("/fee_details", (req, res, next) => {
    if (req.accepts("html") && !req.xhr && !req.query.json) {
        return res.sendFile(path.join(publicPath, "fee_details.html"));
    }
    next();
});

app.get("/payments", (req, res, next) => {
    if (req.accepts("html") && !req.xhr && !req.query.json) {
        return res.sendFile(path.join(publicPath, "payments.html"));
    }
    next();
});

// Also support hyphenated routes
app.get("/fee-details", (req, res) => {
    res.sendFile(path.join(publicPath, "fee_details.html"));
});

// =========================================================
// 1. STUDENTS API ENDPOINTS
// =========================================================

// List all students
function listStudents(req, res) {
    db.query("SELECT * FROM students ORDER BY student_id DESC", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
}

// Get single student by ID or Admission No
function getStudentById(req, res) {
    const key = req.params.id || req.params.studentId || req.params.sno;
    db.query(
        "SELECT * FROM students WHERE student_id = ? OR admission_no = ?",
        [key, key],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) return res.status(404).send("Student not found");
            res.json(results[0]);
        }
    );
}

// Insert new student
function createStudent(req, res) {
    const admissionNo = getValue(req.body, "admission_no", "admissionNo", "roll_no", "rollNo", "sno");
    const studentName = getValue(req.body, "student_name", "studentName", "name", "full_name");
    const classGrade = getValue(req.body, "class_grade", "classGrade", "class", "grade");
    const section = getValue(req.body, "section") || "A";
    const guardianName = getValue(req.body, "guardian_name", "guardianName", "parent_name", "parentName");
    const contactNumber = getValue(req.body, "contact_number", "contactNumber", "phone", "mobile");
    const email = getValue(req.body, "email") || "";
    const status = getValue(req.body, "status") || "Active";

    if (!studentName || !classGrade) {
        return res.status(400).send("Student Name and Class/Grade are required");
    }

    // Auto-generate admission number if missing
    const generatedAdm = admissionNo || ("ADM-" + Math.floor(1000 + Math.random() * 9000));

    const sql = `
        INSERT INTO students (admission_no, student_name, class_grade, section, guardian_name, contact_number, email, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [generatedAdm, studentName, classGrade, section, guardianName || "Guardian", contactNumber || "-", email, status], (err, result) => {
        if (err) {
            console.error("Insert student error:", err.message);
            return res.status(500).send(err.message);
        }
        res.send("Student Inserted Successfully");
    });
}

// Update student
function updateStudent(req, res) {
    const key = req.params.id || req.params.studentId || req.params.sno;
    const updates = [];
    const values = [];

    const fieldMap = [
        ["admission_no", ["admission_no", "admissionNo", "roll_no", "rollNo"]],
        ["student_name", ["student_name", "studentName", "name"]],
        ["class_grade", ["class_grade", "classGrade", "class", "grade"]],
        ["section", ["section"]],
        ["guardian_name", ["guardian_name", "guardianName", "parent_name", "parentName"]],
        ["contact_number", ["contact_number", "contactNumber", "phone", "mobile"]],
        ["email", ["email"]],
        ["status", ["status"]]
    ];

    for (const [col, aliases] of fieldMap) {
        const val = getValue(req.body, ...aliases);
        if (val !== undefined) {
            updates.push(`${col} = ?`);
            values.push(val);
        }
    }

    if (updates.length === 0) {
        return res.status(400).send("No student fields provided for update");
    }

    values.push(key, key);
    const sql = `UPDATE students SET ${updates.join(", ")} WHERE student_id = ? OR admission_no = ?`;

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).send(err.message);
        if (result.affectedRows === 0) return res.status(404).send("Student NOT found");
        res.send("Student Updated Successfully");
    });
}

// Delete student
function deleteStudent(req, res) {
    const key = req.params.id || req.params.studentId || req.params.sno;
    db.query("DELETE FROM students WHERE student_id = ? OR admission_no = ?", [key, key], (err, result) => {
        if (err) return res.status(500).send(err.message);
        if (result.affectedRows === 0) return res.status(404).send("Student NOT found to delete");
        res.send("Student Deleted Successfully");
    });
}

// Register Student Routes (both /students and /api/students)
app.get("/api/students", listStudents);
app.get("/students", listStudents);

app.get("/api/students/:id", getStudentById);
app.get("/students/:id", getStudentById);

app.post("/api/students", createStudent);
app.post("/students", createStudent);

app.put("/api/students/:id", updateStudent);
app.put("/students/:id", updateStudent);

app.delete("/api/students/:id", deleteStudent);
app.delete("/students/:id", deleteStudent);

// =========================================================
// 2. FEE DETAILS API ENDPOINTS
// =========================================================

// List all fee details
function listFeeDetails(req, res) {
    db.query("SELECT * FROM fee_details ORDER BY fee_id DESC", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
}

// Get single fee detail
function getFeeDetailById(req, res) {
    const key = req.params.id || req.params.feeId;
    db.query("SELECT * FROM fee_details WHERE fee_id = ?", [key], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).send("Fee record not found");
        res.json(results[0]);
    });
}

// Insert fee detail
function createFeeDetail(req, res) {
    const feeType = getValue(req.body, "fee_type", "feeType", "title");
    const classGrade = getValue(req.body, "class_grade", "classGrade", "class", "grade") || "All Classes";
    const academicYear = getValue(req.body, "academic_year", "academicYear", "year") || "2026-2027";
    const amount = getValue(req.body, "amount", "fee_amount");
    const dueDate = getValue(req.body, "due_date", "dueDate") || "2026-12-31";
    const description = getValue(req.body, "description", "desc") || "";

    if (!feeType || amount === undefined) {
        return res.status(400).send("Fee Type and Amount are required");
    }

    const sql = `
        INSERT INTO fee_details (fee_type, class_grade, academic_year, amount, due_date, description)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [feeType, classGrade, academicYear, amount, dueDate, description], (err, result) => {
        if (err) return res.status(500).send(err.message);
        res.send("Fee Detail Inserted Successfully");
    });
}

// Update fee detail
function updateFeeDetail(req, res) {
    const key = req.params.id || req.params.feeId;
    const updates = [];
    const values = [];

    const fieldMap = [
        ["fee_type", ["fee_type", "feeType", "title"]],
        ["class_grade", ["class_grade", "classGrade", "class", "grade"]],
        ["academic_year", ["academic_year", "academicYear", "year"]],
        ["amount", ["amount", "fee_amount"]],
        ["due_date", ["due_date", "dueDate"]],
        ["description", ["description", "desc"]]
    ];

    for (const [col, aliases] of fieldMap) {
        const val = getValue(req.body, ...aliases);
        if (val !== undefined) {
            updates.push(`${col} = ?`);
            values.push(val);
        }
    }

    if (updates.length === 0) {
        return res.status(400).send("No fee fields provided for update");
    }

    values.push(key);
    const sql = `UPDATE fee_details SET ${updates.join(", ")} WHERE fee_id = ?`;

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).send(err.message);
        if (result.affectedRows === 0) return res.status(404).send("Fee detail NOT found");
        res.send("Fee Detail Updated Successfully");
    });
}

// Delete fee detail
function deleteFeeDetail(req, res) {
    const key = req.params.id || req.params.feeId;
    db.query("DELETE FROM fee_details WHERE fee_id = ?", [key], (err, result) => {
        if (err) return res.status(500).send(err.message);
        if (result.affectedRows === 0) return res.status(404).send("Fee detail NOT found to delete");
        res.send("Fee Detail Deleted Successfully");
    });
}

// Register Fee Details Routes
app.get("/api/fee_details", listFeeDetails);
app.get("/fee_details", listFeeDetails);
app.get("/api/fee-details", listFeeDetails);

app.get("/api/fee_details/:id", getFeeDetailById);
app.get("/fee_details/:id", getFeeDetailById);
app.get("/api/fee-details/:id", getFeeDetailById);

app.post("/api/fee_details", createFeeDetail);
app.post("/fee_details", createFeeDetail);
app.post("/api/fee-details", createFeeDetail);

app.put("/api/fee_details/:id", updateFeeDetail);
app.put("/fee_details/:id", updateFeeDetail);
app.put("/api/fee-details/:id", updateFeeDetail);

app.delete("/api/fee_details/:id", deleteFeeDetail);
app.delete("/fee_details/:id", deleteFeeDetail);
app.delete("/api/fee-details/:id", deleteFeeDetail);

// =========================================================
// 3. PAYMENTS API ENDPOINTS
// =========================================================

// List all payments with student & fee details joined
function listPayments(req, res) {
    const sql = `
        SELECT 
            p.*,
            s.student_name,
            s.admission_no,
            s.class_grade AS student_class,
            f.fee_type,
            f.amount AS fee_total_amount
        FROM payments p
        LEFT JOIN students s ON p.student_id = s.student_id
        LEFT JOIN fee_details f ON p.fee_id = f.fee_id
        ORDER BY p.payment_id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
}

// Get single payment
function getPaymentById(req, res) {
    const key = req.params.id || req.params.paymentId;
    const sql = `
        SELECT 
            p.*,
            s.student_name,
            s.admission_no,
            s.class_grade AS student_class,
            s.guardian_name,
            s.contact_number,
            f.fee_type,
            f.amount AS fee_total_amount
        FROM payments p
        LEFT JOIN students s ON p.student_id = s.student_id
        LEFT JOIN fee_details f ON p.fee_id = f.fee_id
        WHERE p.payment_id = ? OR p.receipt_no = ?
    `;

    db.query(sql, [key, key], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).send("Payment not found");
        res.json(results[0]);
    });
}

// Record new payment
function createPayment(req, res) {
    const studentId = getValue(req.body, "student_id", "studentId");
    const feeId = getValue(req.body, "fee_id", "feeId");
    const amountPaid = getValue(req.body, "amount_paid", "amountPaid", "amount");
    const paymentMode = getValue(req.body, "payment_mode", "paymentMode", "payment_method", "paymentMethod") || "UPI / Online";
    const paymentDate = getValue(req.body, "payment_date", "paymentDate", "date") || new Date().toISOString().split("T")[0];
    const status = getValue(req.body, "status") || "Paid";
    const remarks = getValue(req.body, "remarks") || "";
    let receiptNo = getValue(req.body, "receipt_no", "receiptNo");

    if (!studentId || !feeId || !amountPaid) {
        return res.status(400).send("Student ID, Fee Category, and Amount Paid are required");
    }

    if (!receiptNo) {
        receiptNo = "REC-" + Date.now().toString().slice(-6);
    }

    const sql = `
        INSERT INTO payments (receipt_no, student_id, fee_id, amount_paid, payment_date, payment_mode, status, remarks)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [receiptNo, studentId, feeId, amountPaid, paymentDate, paymentMode, status, remarks], (err, result) => {
        if (err) return res.status(500).send(err.message);
        res.send("Payment Recorded Successfully. Receipt: " + receiptNo);
    });
}

// Update payment
function updatePayment(req, res) {
    const key = req.params.id || req.params.paymentId;
    const updates = [];
    const values = [];

    const fieldMap = [
        ["student_id", ["student_id", "studentId"]],
        ["fee_id", ["fee_id", "feeId"]],
        ["amount_paid", ["amount_paid", "amountPaid", "amount"]],
        ["payment_date", ["payment_date", "paymentDate", "date"]],
        ["payment_mode", ["payment_mode", "paymentMode", "payment_method", "paymentMethod"]],
        ["status", ["status"]],
        ["remarks", ["remarks"]]
    ];

    for (const [col, aliases] of fieldMap) {
        const val = getValue(req.body, ...aliases);
        if (val !== undefined) {
            updates.push(`${col} = ?`);
            values.push(val);
        }
    }

    if (updates.length === 0) {
        return res.status(400).send("No payment fields provided for update");
    }

    values.push(key, key);
    const sql = `UPDATE payments SET ${updates.join(", ")} WHERE payment_id = ? OR receipt_no = ?`;

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).send(err.message);
        if (result.affectedRows === 0) return res.status(404).send("Payment record NOT found");
        res.send("Payment Record Updated Successfully");
    });
}

// Delete payment
function deletePayment(req, res) {
    const key = req.params.id || req.params.paymentId;
    db.query("DELETE FROM payments WHERE payment_id = ? OR receipt_no = ?", [key, key], (err, result) => {
        if (err) return res.status(500).send(err.message);
        if (result.affectedRows === 0) return res.status(404).send("Payment record NOT found to delete");
        res.send("Payment Record Deleted Successfully");
    });
}

// Register Payments Routes
app.get("/api/payments", listPayments);
app.get("/payments", listPayments);

app.get("/api/payments/:id", getPaymentById);
app.get("/payments/:id", getPaymentById);

app.post("/api/payments", createPayment);
app.post("/payments", createPayment);

app.put("/api/payments/:id", updatePayment);
app.put("/payments/:id", updatePayment);

app.delete("/api/payments/:id", deletePayment);
app.delete("/payments/:id", deletePayment);

// =========================================================
// 4. DASHBOARD STATS API ENDPOINT
// =========================================================
app.get("/api/dashboard-stats", (req, res) => {
    const stats = {
        totalStudents: 0,
        totalFeeCategories: 0,
        totalPaymentsCount: 0,
        totalRevenue: 0,
        recentPayments: []
    };

    db.query("SELECT COUNT(*) AS totalStudents FROM students", (e1, r1) => {
        if (!e1 && r1.length > 0) stats.totalStudents = r1[0].totalStudents;

        db.query("SELECT COUNT(*) AS totalFeeCategories FROM fee_details", (e2, r2) => {
            if (!e2 && r2.length > 0) stats.totalFeeCategories = r2[0].totalFeeCategories;

            db.query("SELECT COUNT(*) AS totalPaymentsCount, COALESCE(SUM(amount_paid), 0) AS totalRevenue FROM payments", (e3, r3) => {
                if (!e3 && r3.length > 0) {
                    stats.totalPaymentsCount = r3[0].totalPaymentsCount;
                    stats.totalRevenue = r3[0].totalRevenue;
                }

                const recentSql = `
                    SELECT 
                        p.payment_id,
                        p.receipt_no,
                        p.amount_paid,
                        p.payment_date,
                        p.payment_mode,
                        p.status,
                        s.student_name,
                        s.class_grade,
                        f.fee_type
                    FROM payments p
                    LEFT JOIN students s ON p.student_id = s.student_id
                    LEFT JOIN fee_details f ON p.fee_id = f.fee_id
                    ORDER BY p.payment_id DESC
                    LIMIT 5
                `;

                db.query(recentSql, (e4, r4) => {
                    if (!e4) stats.recentPayments = r4;
                    res.json(stats);
                });
            });
        });
    });
});

// Fallback compatibility route for legacy /rooms
app.get("/rooms", listStudents);
app.post("/rooms", createStudent);

// Start Server
app.listen(PORT, () => {
    console.log(`School Fee Payment Management Server is running at: http://localhost:${PORT}`);
});
