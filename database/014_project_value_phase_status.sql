ALTER TABLE tailor_projects ADD COLUMN expected_value numeric(18,2) CHECK(expected_value>=0);
ALTER TABLE tailor_project_phases ADD COLUMN declared_status text CHECK(declared_status IN ('Da avviare','In corso','In attesa','Completata','Non applicabile'));
ALTER TABLE tailor_project_phases ADD COLUMN status_note text NOT NULL DEFAULT '';
ALTER TABLE tailor_project_phases ADD COLUMN status_version integer NOT NULL DEFAULT 1;
