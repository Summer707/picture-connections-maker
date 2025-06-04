import { useState } from "react";
import { useRouter } from "next/router";
import { useDropzone } from "react-dropzone";
import { supabase } from "../lib/supabase";
import { v4 as uuidv4 } from "uuid";

export default function CreatePage() {
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [groupNames, setGroupNames] = useState(['', '', '', '']);
  const router = useRouter();

  const onDrop = (acceptedFiles) => {
    if (images.length + acceptedFiles.length > 16) {
      alert("You can only upload 16 images total.");
      return;
    }
    const withPreview = acceptedFiles.map((file, index) => {
      const total = images.length + index;
      const groupIndex = Math.floor(total / 4);
      const groupName = groupNames[groupIndex] || `Group ${String.fromCharCode(65 + groupIndex)}`;
      return {
        id: uuidv4(),
        file,
        preview: URL.createObjectURL(file),
        group_name: groupName,
      };
    });

    setImages((prev) => [...prev, ...withPreview]);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { "image/*": [] } });

  const handleGroupNameChange = (index, value) => {
    const newGroupNames = [...groupNames];
    newGroupNames[index] = value;
    setGroupNames(newGroupNames);

    // Update group names for images in this group
    setImages(prev => prev.map((img, i) => {
      const groupIndex = Math.floor(i / 4);
      if (groupIndex === index) {
        return {
          ...img,
          group_name: value || `Group ${String.fromCharCode(65 + groupIndex)}`
        };
      }
      return img;
    }));
  };

  const handleSubmit = async () => {
    if (images.length !== 16) {
      alert("You must upload exactly 16 images.");
      return;
    }

    // Validate group names
    if (groupNames.some(name => !name.trim())) {
      alert("Please name all groups before saving.");
      return;
    }

    setSaving(true);
    try {
      // Create puzzle record
      const { data: puzzle, error: puzzleError } = await supabase
        .from('puzzles')
        .insert([{ 
          is_public: true
        }])
        .select()
        .single();

      if (puzzleError) {
        console.error('Error creating puzzle:', puzzleError);
        throw new Error(`Failed to create puzzle: ${puzzleError.message}`);
      }

      if (!puzzle) {
        throw new Error('No puzzle data returned after creation');
      }

      // Upload images and create image records
      const uploaded = [];
      for (let img of images) {
        try {
          const filename = `${uuidv4()}.jpg`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('puzzle-images')
            .upload(filename, img.file);

          if (uploadError) {
            console.error('Error uploading image:', uploadError);
            throw new Error(`Failed to upload image: ${uploadError.message}`);
          }

          const url = supabase.storage.from('puzzle-images').getPublicUrl(filename).data.publicUrl;
          
          const { error: imageError } = await supabase
            .from('images')
            .insert([{
              puzzle_id: puzzle.id,
              url,
              group_name: img.group_name
            }]);

          if (imageError) {
            console.error('Error creating image record:', imageError);
            throw new Error(`Failed to create image record: ${imageError.message}`);
          }
          
          uploaded.push({ url, group: img.group_name });
        } catch (imgError) {
          console.error('Error processing image:', imgError);
          throw new Error(`Failed to process image: ${imgError.message}`);
        }
      }

      router.push(`/play/${puzzle.id}`);
    } catch (error) {
      console.error('Detailed error saving puzzle:', error);
      alert(`Failed to save puzzle: ${error.message}`);
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
          Create a Picture Connections Puzzle
        </h1>

        {/* Group Names Input */}
        <div className="mb-8 bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold mb-4">Name Your Groups</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {groupNames.map((name, index) => (
              <div key={index} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Group {String.fromCharCode(65 + index)}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleGroupNameChange(index, e.target.value)}
                  placeholder={`Enter group ${index + 1} name`}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        <div
          {...getRootProps()}
          className="border-2 border-dashed p-6 rounded-lg mb-6 cursor-pointer bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-colors text-center shadow-lg"
        >
          <input {...getInputProps()} />
          <p className="text-gray-600">Drag and drop images here, or click to select (up to 16)</p>
          <p className="text-sm text-gray-500 mt-2">Upload 4 images for each group in order</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {images.map((img, index) => {
            const groupIndex = Math.floor(index / 4);
            const groupName = groupNames[groupIndex] || `Group ${String.fromCharCode(65 + groupIndex)}`;
            
            return (
              <div key={img.id} className="bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-lg">
                <div className="relative aspect-[3/2] mb-2">
                  <img src={img.preview} alt="preview" className="w-full h-full object-cover rounded" />
                  <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    {groupName}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {saving ? "Saving..." : "Save Puzzle & Share"}
        </button>
      </div>
    </div>
  );
}
