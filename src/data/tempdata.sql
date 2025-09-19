-- When you move from Oracle SQL to Databricks (Spark SQL / Delta Lake), you need to convert Oracle-specific SQL scripts into a format compatible with Databricks SQL.

-- 🔑 Key Differences (Oracle → Databricks)

-- Data Types

-- NUMBER → DECIMAL(p,s) or BIGINT / DOUBLE (depending on scale)

-- VARCHAR2 → STRING

-- DATE → DATE

-- TIMESTAMP → TIMESTAMP

-- CLOB / BLOB → STRING or BINARY

-- Functions

-- SYSDATE → current_date()

-- SYSTIMESTAMP → current_timestamp()

-- NVL(col, val) → coalesce(col, val)

-- DECODE(expr, val1, res1, val2, res2, ...) → CASE WHEN expr = val1 THEN res1 WHEN expr = val2 THEN res2 ... END

-- TO_DATE('2024-09-18', 'YYYY-MM-DD') → to_date('2024-09-18')

-- TO_CHAR(date, 'YYYY-MM-DD') → date_format(date, 'yyyy-MM-dd')

-- String concatenation col1 || col2 → concat(col1, col2)

-- Sequences & Auto-increment

-- Oracle: my_seq.NEXTVAL

-- Databricks: Use GENERATED ALWAYS AS IDENTITY or monotonically_increasing_id().

-- PL/SQL (Procedures, Loops, Triggers)

-- Databricks SQL doesn’t support PL/SQL procedural code directly.

-- Convert logic into PySpark / Scala notebooks, or Databricks Jobs.

-- Joins & DUAL Table

-- Oracle: SELECT 1 FROM DUAL;

-- Databricks: SELECT 1;

-- Merge / Upsert

-- Oracle: MERGE INTO ... USING ...

-- Databricks: MERGE INTO ... USING ... works, but syntax is closer to ANSI SQL.

-- 🚀 Example Conversion

-- Oracle Script

-- CREATE TABLE employees (
--   emp_id NUMBER PRIMARY KEY,
--   emp_name VARCHAR2(100),
--   hire_date DATE DEFAULT SYSDATE,
--   salary NUMBER(10,2)
-- );

-- INSERT INTO employees (emp_id, emp_name, hire_date, salary)
-- VALUES (emp_seq.NEXTVAL, NVL('John Doe', 'Unknown'), SYSDATE, 5000);

-- SELECT emp_name || ' - ' || TO_CHAR(hire_date, 'YYYY-MM-DD') AS emp_info
-- FROM employees
-- WHERE salary > 4000;


-- Databricks SQL Equivalent

-- CREATE TABLE employees (
--   emp_id BIGINT GENERATED ALWAYS AS IDENTITY,
--   emp_name STRING,
--   hire_date DATE DEFAULT current_date(),
--   salary DECIMAL(10,2)
-- );

-- INSERT INTO employees (emp_name, hire_date, salary)
-- VALUES (coalesce('John Doe', 'Unknown'), current_date(), 5000);

-- SELECT concat(emp_name, ' - ', date_format(hire_date, 'yyyy-MM-dd')) AS emp_info
-- FROM employees
-- WHERE salary > 4000;

-- 🛠️ Migration Steps

-- Extract Oracle DDLs & Scripts

-- Use DBMS_METADATA.GET_DDL to export schema.

-- Convert DDLs

-- Change data types (NUMBER → DECIMAL, VARCHAR2 → STRING).

-- Convert Functions & Queries

-- Replace Oracle-only functions with Databricks SQL equivalents.

-- Handle PL/SQL

-- Rewrite logic in PySpark/Scala (Databricks notebooks).

-- Test Incrementally

-- Validate schema creation, inserts, queries in Databricks.

-- ⚡ Tip: Databricks has a SQL function reference (very close to ANSI SQL). If something doesn’t exist (like DECODE), always use CASE.

-- 👉 Do you want me to prepare a conversion cheat sheet (Oracle → Databricks mapping table) that your niece (as a fresher) can quickly use during migration?

-- You said:
-- yes please
-- ChatGPT said:

-- Perfect 👍 — here’s a cheat sheet for quickly converting Oracle SQL scripts into Databricks SQL (Spark SQL / Delta Lake).

-- 📝 Oracle → Databricks SQL Conversion Cheat Sheet
-- 1. Data Types
-- Oracle	Databricks SQL
-- NUMBER	DECIMAL(p,s) / BIGINT / DOUBLE
-- VARCHAR2(n)	STRING
-- CHAR(n)	STRING
-- CLOB	STRING
-- BLOB	BINARY
-- DATE	DATE
-- TIMESTAMP	TIMESTAMP
-- 2. Date & Time Functions
-- Oracle	Databricks SQL
-- SYSDATE	current_date()
-- SYSTIMESTAMP	current_timestamp()
-- TO_DATE('2024-09-18','YYYY-MM-DD')	to_date('2024-09-18')
-- TO_CHAR(hire_date,'YYYY-MM-DD')	date_format(hire_date,'yyyy-MM-dd')
-- ADD_MONTHS(date, n)	add_months(date, n)
-- MONTHS_BETWEEN(d1,d2)	months_between(d1,d2)
-- 3. Null Handling
-- Oracle	Databricks SQL
-- NVL(expr, val)	coalesce(expr, val)
-- NVL2(expr, val1, val2)	CASE WHEN expr IS NOT NULL THEN val1 ELSE val2 END
-- 4. String Functions
-- Oracle	Databricks SQL
-- `col1	
-- SUBSTR(str, start, len)	substr(str, start, len)
-- INSTR(str, sub)	instr(str, sub)
-- LTRIM(str) / RTRIM(str)	ltrim(str) / rtrim(str)
-- LENGTH(str)	length(str)
-- UPPER(str) / LOWER(str)	upper(str) / lower(str)
-- 5. Conditional Functions
-- Oracle	Databricks SQL
-- DECODE(expr, v1, r1, v2, r2, ...)	CASE WHEN expr=v1 THEN r1 WHEN expr=v2 THEN r2 END
-- CASE ... WHEN ... THEN ... END	Same in Databricks
-- 6. Sequences & Auto-Increment
-- Oracle	Databricks SQL
-- emp_seq.NEXTVAL	GENERATED ALWAYS AS IDENTITY (table DDL)
-- 	Or monotonically_increasing_id() (query side)
-- 7. System Tables
-- Oracle	Databricks SQL
-- SELECT 1 FROM DUAL;	SELECT 1;
-- 8. Merge / Upsert

-- | Oracle Example |

-- MERGE INTO employees e
-- USING new_employees n
-- ON (e.emp_id = n.emp_id)
-- WHEN MATCHED THEN UPDATE SET e.salary = n.salary
-- WHEN NOT MATCHED THEN INSERT (emp_id, emp_name) VALUES (n.emp_id, n.emp_name);


-- | Databricks Equivalent |

-- MERGE INTO employees e
-- USING new_employees n
-- ON e.emp_id = n.emp_id
-- WHEN MATCHED THEN UPDATE SET *
-- WHEN NOT MATCHED THEN INSERT *;

-- 9. PL/SQL Blocks

-- ❌ Not supported in Databricks SQL.
-- ✅ Rewrite logic in PySpark / Scala / Python notebooks.

-- 🚀 Fresher-Friendly Interview Answer

-- “Oracle scripts often use proprietary functions like NVL, DECODE, or sequences like NEXTVAL. In Databricks, we use ANSI SQL-style functions — for example, NVL becomes coalesce, DECODE becomes CASE, and sequences are replaced by identity columns or functions like monotonically_increasing_id(). The core difference is that Databricks SQL is closer to ANSI SQL and integrates with Spark for large-scale data.”

-- 👉 Do you also want me to create a sample converted Oracle script (DDL + insert + query) side-by-side with Databricks SQL, so she can practice directly with real code examples?

-- You said:
-- yes please
-- ChatGPT said:

-- Perfect 👍 Let’s break it down with a step-by-step approach to convert an Oracle SQL script into Databricks-compatible SQL (or PySpark SQL if needed).

-- 🔄 Steps to Convert Oracle Script → Databricks
-- 1. Check SQL Dialect Differences

-- Oracle and Databricks (Spark SQL) have different syntax rules. Key areas to check:

-- Data Types

-- VARCHAR2, NUMBER, DATE → Convert to STRING, DECIMAL, TIMESTAMP

-- Sequences

-- Oracle: SEQ_NAME.NEXTVAL

-- Databricks: use GENERATE_UUID() or ROW_NUMBER() OVER()

-- Functions

-- NVL(col, val) → COALESCE(col, val)

-- SYSDATE → CURRENT_TIMESTAMP()

-- TO_DATE('2025-09-18', 'YYYY-MM-DD') → TO_DATE('2025-09-18')

-- Joins & Outer Joins

-- Oracle table1.column(+) = table2.column → Databricks LEFT JOIN

-- String Handling

-- Oracle || → Databricks concat(col1, col2)

-- 2. DDL Conversion (Tables)

-- Example Oracle DDL:

-- CREATE TABLE EMPLOYEE (
--   EMP_ID NUMBER PRIMARY KEY,
--   EMP_NAME VARCHAR2(100),
--   JOIN_DATE DATE
-- );


-- Convert to Databricks:

-- CREATE TABLE EMPLOYEE (
--   EMP_ID DECIMAL(10,0),
--   EMP_NAME STRING,
--   JOIN_DATE TIMESTAMP
-- )
-- USING DELTA;

-- 3. DML Conversion (Insert/Select)

-- Oracle:

-- INSERT INTO EMPLOYEE (EMP_ID, EMP_NAME, JOIN_DATE)
-- VALUES (EMP_SEQ.NEXTVAL, 'John', SYSDATE);


-- Databricks:

-- INSERT INTO EMPLOYEE (EMP_ID, EMP_NAME, JOIN_DATE)
-- VALUES (CAST(1 AS DECIMAL(10,0)), 'John', CURRENT_TIMESTAMP());


-- (Replace sequence with manual ID logic or ROW_NUMBER if batch insert)

-- 4. PL/SQL Blocks

-- Oracle supports PL/SQL (BEGIN ... END;)
-- Databricks doesn’t. You’ll need:

-- PySpark/Scala notebooks for procedural logic

-- Or Databricks SQL for queries only

-- Example Oracle PL/SQL:

-- BEGIN
--   INSERT INTO EMPLOYEE (EMP_ID, EMP_NAME) VALUES (EMP_SEQ.NEXTVAL, 'Alex');
-- END;


-- Databricks equivalent (in PySpark):

-- spark.sql("""
-- INSERT INTO EMPLOYEE (EMP_ID, EMP_NAME)
-- VALUES (2, 'Alex')
-- """)

-- 5. Migration Strategy

-- ✅ Use Databricks SQL Analytics for queries
-- ✅ Rewrite procedural parts in PySpark (Python/Scala)
-- ✅ Use Delta tables instead of Oracle tables