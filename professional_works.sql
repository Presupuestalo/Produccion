-- Create professional_works table
CREATE TABLE IF NOT EXISTS professional_works (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    project_date TIMESTAMP WITH TIME ZONE,
    featured_image_url TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create professional_work_photos table
CREATE TABLE IF NOT EXISTS professional_work_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_id UUID NOT NULL REFERENCES professional_works(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    phase TEXT CHECK (phase IN ('before', 'during', 'after')),
    storage_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE professional_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_work_photos ENABLE ROW LEVEL SECURITY;

-- Policies for professional_works
CREATE POLICY "Users can view their own works" 
    ON professional_works FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own works" 
    ON professional_works FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own works" 
    ON professional_works FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own works" 
    ON professional_works FOR DELETE 
    USING (auth.uid() = user_id);

-- Policies for professional_work_photos
CREATE POLICY "Users can view photos of their own works" 
    ON professional_work_photos FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM professional_works 
        WHERE professional_works.id = professional_work_photos.work_id 
        AND professional_works.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert photos to their own works" 
    ON professional_work_photos FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM professional_works 
        WHERE professional_works.id = professional_work_photos.work_id 
        AND professional_works.user_id = auth.uid()
    ));

CREATE POLICY "Users can update photos of their own works" 
    ON professional_work_photos FOR UPDATE 
    USING (EXISTS (
        SELECT 1 FROM professional_works 
        WHERE professional_works.id = professional_work_photos.work_id 
        AND professional_works.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete photos of their own works" 
    ON professional_work_photos FOR DELETE 
    USING (EXISTS (
        SELECT 1 FROM professional_works 
        WHERE professional_works.id = professional_work_photos.work_id 
        AND professional_works.user_id = auth.uid()
    ));

-- Public viewing policy (if we want to showcase them)
CREATE POLICY "Anyone can view published works" 
    ON professional_works FOR SELECT 
    USING (is_published = TRUE);

CREATE POLICY "Anyone can view photos of published works" 
    ON professional_work_photos FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM professional_works 
        WHERE professional_works.id = professional_work_photos.work_id 
        AND professional_works.is_published = TRUE
    ));
