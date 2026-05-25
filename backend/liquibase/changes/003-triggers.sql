--liquibase formatted sql

--changeset artistry:003-fn-create_profile_for_new_user splitStatements:false
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
    RETURNS TRIGGER AS
$$
BEGIN
    INSERT INTO profiles (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--rollback DROP FUNCTION IF EXISTS create_profile_for_new_user;

--changeset artistry:003-trigger-create_profile splitStatements:false
CREATE TRIGGER trigger_create_profile
    AFTER INSERT ON users
    FOR EACH ROW
EXECUTE FUNCTION create_profile_for_new_user();
--rollback DROP TRIGGER IF EXISTS trigger_create_profile ON users;

--changeset artistry:003-fn-check_self_follow splitStatements:false
CREATE OR REPLACE FUNCTION check_self_follow()
    RETURNS TRIGGER AS
$$
BEGIN
    IF NEW.follower_id = NEW.following_id THEN
        RAISE EXCEPTION 'Users cannot follow themselves.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--rollback DROP FUNCTION IF EXISTS check_self_follow;

--changeset artistry:003-trigger-prevent_self_follow splitStatements:false
CREATE TRIGGER trigger_prevent_self_follow
    BEFORE INSERT ON follows
    FOR EACH ROW
EXECUTE FUNCTION check_self_follow();
--rollback DROP TRIGGER IF EXISTS trigger_prevent_self_follow ON follows;

--changeset artistry:003-fn-set_published_at splitStatements:false
CREATE OR REPLACE FUNCTION set_published_at_timestamp()
    RETURNS TRIGGER AS
$$
BEGIN
    IF NEW.status = 'published'
        AND (OLD.status IS DISTINCT FROM 'published')
        AND NEW.published_at IS NULL
    THEN
        NEW.published_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--rollback DROP FUNCTION IF EXISTS set_published_at_timestamp;

--changeset artistry:003-trigger-set_artwork_published_at splitStatements:false
CREATE TRIGGER trigger_set_artwork_published_at
    BEFORE UPDATE ON artworks
    FOR EACH ROW
EXECUTE FUNCTION set_published_at_timestamp();
--rollback DROP TRIGGER IF EXISTS trigger_set_artwork_published_at ON artworks;
