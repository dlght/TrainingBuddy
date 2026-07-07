-- Add is_favourite column to workouts table
ALTER TABLE workouts ADD COLUMN is_favourite INTEGER NOT NULL DEFAULT 0;

-- Create index for favourite workouts
CREATE INDEX IF NOT EXISTS workouts_favourite_idx ON workouts(is_favourite);
