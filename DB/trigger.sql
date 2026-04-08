--When a user registers in the users table, you shouldn't have to manually create a row in profiles. This trigger does it automatically.
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
    RETURNS TRIGGER AS
$$
BEGIN
    INSERT INTO profiles (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_profile
    AFTER INSERT
    ON users
    FOR EACH ROW
EXECUTE FUNCTION create_profile_for_new_user();


--A user shouldn't be able to follow themselves. This enforces that logic at the database level.
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

CREATE TRIGGER trigger_prevent_self_follow
    BEFORE INSERT
    ON follows
    FOR EACH ROW
EXECUTE FUNCTION check_self_follow();


--If an artist changes an artwork from 'draft' to 'published', the system should automatically stamp the current time without the API needing to send the date.
CREATE OR REPLACE FUNCTION set_published_at_timestamp()
    RETURNS TRIGGER AS
$$
BEGIN
    IF NEW.status = 'published' AND (OLD.status IS DISTINCT FROM 'published') AND NEW.published_at IS NULL THEN
        NEW.published_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_artwork_published_at
    BEFORE UPDATE
    ON artworks
    FOR EACH ROW
EXECUTE FUNCTION set_published_at_timestamp();
