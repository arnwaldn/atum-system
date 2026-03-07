-- Audit Flow Schema
-- SQLite database for system flow tracing

PRAGMA foreign_keys = ON;

-- Sessions: top-level audit sessions
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    purpose TEXT NOT NULL CHECK (purpose IN (
        'security-audit', 'documentation', 'compliance',
        'ideation', 'debugging', 'architecture-review', 'incident-review'
    )),
    description TEXT,
    granularity TEXT NOT NULL DEFAULT 'coarse-grained' CHECK (granularity IN ('fine-grained', 'coarse-grained')),
    git_commit TEXT,
    git_branch TEXT,
    git_dirty INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived'))
);

-- Flows: named sequences within a session
CREATE TABLE IF NOT EXISTS flows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    entry_point TEXT,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    UNIQUE(session_id, name)
);

-- Tuples: individual traced steps within a flow
CREATE TABLE IF NOT EXISTS tuples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flow_id INTEGER NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    layer TEXT NOT NULL CHECK (layer IN ('CODE', 'API', 'NETWORK', 'AUTH', 'DATA')),
    action TEXT NOT NULL,
    subject TEXT NOT NULL,
    file_ref TEXT,
    props TEXT,  -- JSON
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'concern'))
);

-- Edges: relations between tuples
CREATE TABLE IF NOT EXISTS edges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_tuple INTEGER NOT NULL REFERENCES tuples(id) ON DELETE CASCADE,
    to_tuple INTEGER NOT NULL REFERENCES tuples(id) ON DELETE CASCADE,
    relation TEXT NOT NULL CHECK (relation IN (
        'TRIGGERS', 'READS', 'WRITES', 'VALIDATES',
        'TRANSFORMS', 'BRANCHES', 'MERGES'
    )),
    condition TEXT,  -- Required for BRANCHES
    props TEXT,      -- JSON
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Findings: observations and concerns
CREATE TABLE IF NOT EXISTS findings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    flow_id INTEGER REFERENCES flows(id) ON DELETE SET NULL,
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    tuple_refs TEXT,  -- JSON array of tuple IDs
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'wontfix')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_flows_session ON flows(session_id);
CREATE INDEX IF NOT EXISTS idx_tuples_flow ON tuples(flow_id);
CREATE INDEX IF NOT EXISTS idx_edges_from ON edges(from_tuple);
CREATE INDEX IF NOT EXISTS idx_edges_to ON edges(to_tuple);
CREATE INDEX IF NOT EXISTS idx_findings_session ON findings(session_id);
CREATE INDEX IF NOT EXISTS idx_findings_flow ON findings(flow_id);

-- Views

-- Session summary with counts
CREATE VIEW IF NOT EXISTS v_session_summary AS
SELECT
    s.id, s.name, s.purpose, s.description, s.granularity,
    s.git_commit, s.git_branch, s.git_dirty,
    s.created_at, s.updated_at, s.status,
    COUNT(DISTINCT f.id) AS flow_count,
    COUNT(DISTINCT t.id) AS tuple_count,
    COUNT(DISTINCT fi.id) AS finding_count
FROM sessions s
LEFT JOIN flows f ON f.session_id = s.id
LEFT JOIN tuples t ON t.flow_id = f.id AND t.status != 'deleted'
LEFT JOIN findings fi ON fi.session_id = s.id
GROUP BY s.id;

-- Flow summary with tuple and concern counts
CREATE VIEW IF NOT EXISTS v_flow_summary AS
SELECT
    f.id, f.session_id, f.name, f.entry_point, f.description,
    f.created_at, f.status,
    COUNT(DISTINCT t.id) AS tuple_count,
    COUNT(DISTINCT CASE WHEN t.status = 'concern' THEN t.id END) AS concern_count
FROM flows f
LEFT JOIN tuples t ON t.flow_id = f.id AND t.status != 'deleted'
GROUP BY f.id;

-- Branch and merge point detection
CREATE VIEW IF NOT EXISTS v_branch_merge_points AS
SELECT
    t.id AS tuple_id,
    f.name AS flow_name,
    t.action,
    t.layer,
    CASE
        WHEN outgoing.cnt > 1 AND incoming.cnt > 1 THEN 'branch_merge'
        WHEN outgoing.cnt > 1 THEN 'branch'
        WHEN incoming.cnt > 1 THEN 'merge'
    END AS node_type,
    COALESCE(incoming.cnt, 0) AS incoming_edges,
    COALESCE(outgoing.cnt, 0) AS outgoing_edges
FROM tuples t
JOIN flows f ON t.flow_id = f.id
LEFT JOIN (
    SELECT to_tuple, COUNT(*) AS cnt FROM edges GROUP BY to_tuple
) incoming ON incoming.to_tuple = t.id
LEFT JOIN (
    SELECT from_tuple, COUNT(*) AS cnt FROM edges GROUP BY from_tuple
) outgoing ON outgoing.from_tuple = t.id
WHERE (COALESCE(outgoing.cnt, 0) > 1 OR COALESCE(incoming.cnt, 0) > 1)
AND t.status != 'deleted';
