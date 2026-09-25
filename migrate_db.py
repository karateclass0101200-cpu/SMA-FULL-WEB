import sqlite3

DATABASE = "database.db"

conn = sqlite3.connect(DATABASE)


# =========================================================
# STUDENTS TABLE MIGRATION
# =========================================================

existing_columns = {
    row[1]
    for row in conn.execute(
        "PRAGMA table_info(students)"
    ).fetchall()
}

columns_to_add = {
    "dob": "TEXT",
    "gender": "TEXT",
    "student_mobile": "TEXT",
    "email": "TEXT",
    "parent_name": "TEXT",
    "parent_mobile": "TEXT",
    "emergency_contact": "TEXT",
    "address": "TEXT",
    "experience": "TEXT",
    "previous_training": "TEXT",
    "preferred_batch": "TEXT",
    "preferred_days": "TEXT",
    "photo_path": "TEXT",
    "profile_completed": "INTEGER DEFAULT 0",
    "student_profile_edited": "INTEGER DEFAULT 0"
}

for column, column_type in columns_to_add.items():

    if column not in existing_columns:

        conn.execute(
            f"ALTER TABLE students ADD COLUMN {column} {column_type}"
        )

        print("Added:", column)


# =========================================================
# APPLICATIONS TABLE MIGRATION
# =========================================================

existing_application_columns = {
    row[1]
    for row in conn.execute(
        "PRAGMA table_info(applications)"
    ).fetchall()
}

application_columns_to_add = {
    "dob": "TEXT",
    "gender": "TEXT",
    "student_mobile": "TEXT",
    "email": "TEXT",
    "parent_name": "TEXT",
    "parent_mobile": "TEXT",
    "emergency_contact": "TEXT",
    "address": "TEXT",
    "experience": "TEXT",
    "preferred_days": "TEXT",
    "status": "TEXT DEFAULT 'PENDING'",
    "created_at": "TEXT"
}

for column, column_type in application_columns_to_add.items():

    if column not in existing_application_columns:

        conn.execute(
            f"ALTER TABLE applications "
            f"ADD COLUMN {column} {column_type}"
        )

        print(
            "Added applications column:",
            column
        )


# =========================================================
# REMOVE BATCH AND TRAINING DAYS FROM APPLICATIONS
# =========================================================

application_columns = {
    row[1]
    for row in conn.execute(
        "PRAGMA table_info(applications)"
    ).fetchall()
}

if "preferred_batch" in application_columns:

    conn.execute("""
        ALTER TABLE applications
        DROP COLUMN preferred_batch
    """)

    print(
        "Removed applications column: preferred_batch"
    )


if "preferred_days" in application_columns:

    conn.execute("""
        ALTER TABLE applications
        DROP COLUMN preferred_days
    """)

    print(
        "Removed applications column: preferred_days"
    )


# =========================================================
# MESSAGES TABLE MIGRATION
# =========================================================

message_table_exists = conn.execute("""
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
      AND name = 'messages'
""").fetchone()


if message_table_exists:

    existing_message_columns = {
        row[1]
        for row in conn.execute(
            "PRAGMA table_info(messages)"
        ).fetchall()
    }


    # SUBJECT
    if "subject" not in existing_message_columns:

        conn.execute("""
            ALTER TABLE messages
            ADD COLUMN subject TEXT
        """)

        print(
            "Added messages column: subject"
        )

    else:

        print(
            "messages.subject already exists."
        )


    # STATUS
    if "status" not in existing_message_columns:

        conn.execute("""
            ALTER TABLE messages
            ADD COLUMN status TEXT DEFAULT 'NEW'
        """)

        print(
            "Added messages column: status"
        )

    else:

        print(
            "messages.status already exists."
        )


else:

    # If messages table does not exist,
    # create it completely.

    conn.execute("""
        CREATE TABLE messages (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            sender_id TEXT NOT NULL,

            receiver_id TEXT NOT NULL,

            subject TEXT,

            message TEXT NOT NULL,

            status TEXT DEFAULT 'NEW',

            created_at TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP

        )
    """)

    print(
        "Created messages table."
    )


# =========================================================
# SAVE ALL CHANGES
# =========================================================

conn.commit()

conn.close()

print(
    "Database migration completed."
)