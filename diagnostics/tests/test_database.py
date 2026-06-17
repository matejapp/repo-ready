from diagnostics.checks.database import check_database


def test_database_url_passes(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/app")
    assert check_database("DATABASE_URL", "postgres")["status"] == "passed"


def test_database_url_rejects_wrong_scheme(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "mysql://localhost/app")
    assert check_database("DATABASE_URL", "postgres")["status"] == "failed"


def test_database_url_rejects_missing_host(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://")
    assert check_database("DATABASE_URL", "postgres")["status"] == "failed"


def test_database_url_skips_missing_variable(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    assert check_database("DATABASE_URL", "postgres")["status"] == "skipped"
