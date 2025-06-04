import { useState } from "react";
import { useRouter } from "next/router";
import { useDropzone } from "react-dropzone";
import { supabase } from "../lib/supabase";
import { v4 as uuidv4 } from "uuid";

export default function CreatePage() {
  const [images, setImages] = useState([]);
  const [groupAssignments, setGroupAssignments] = useState({});
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
        defaultGroup: groupName,
      };
    });

    setImages((prev) => [...prev, ...withPreview]);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { "image/*": [] } });

  const assignGroup = (id, group) => {
    setGroupAssignments((prev) => ({ ...prev, [id]: group }));
  };

  const handleGroupNameChange = (index, value) => {
    const newGroupNames = [...groupNames];
    newGroupNames[index] = value;
    setGroupNames(newGroupNames);

    // Update default groups for images that haven't been manually assigned
    setImages(prev => prev.map(img => {
      if (groupAssignments[img.id]) return img; // Skip manually assigned images
      const groupIndex = Math.floor(prev.indexOf(img) / 4);
      return {
        ...img,
        defaultGroup: newGroupNames[groupIndex] || `Group ${String.fromCharCode(65 + groupIndex)}`
      };
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

    const groupCounts = {};
    Object.values(groupAssignments).forEach((group) => {
      groupCounts[group] = (groupCounts[group] || 0) + 1;
    });
    if (Object.values(groupCounts).some((count) => count !== 4)) {
      alert("Each group must have exactly 4 images.");
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
          
          // Get the group name, either from assignments or default
          const groupName = groupAssignments[img.id] || img.defaultGroup;
          
          const { error: imageError } = await supabase
            .from('images')
            .insert([{
              puzzle_id: puzzle.id,
              url,
              group_name: groupName
            }]);

          if (imageError) {
            console.error('Error creating image record:', imageError);
            throw new Error(`Failed to create image record: ${imageError.message}`);
          }
          
          uploaded.push({ url, group: groupName });
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 text-gray-800">
          Create a Picture Connections Puzzle
        </h1>

        {/* Group Names Input */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
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
          className="border-2 border-dashed p-6 rounded-lg mb-6 cursor-pointer bg-white hover:bg-gray-50 transition-colors text-center"
        >
          <input {...getInputProps()} />
          <p className="text-gray-600">Drag and drop images here, or click to select (16)</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {images.map((img) => (
            <div key={img.id} className="bg-white p-2 rounded-lg shadow-sm">
              <img src={img.preview} alt="preview" className="w-full h-32 object-cover rounded mb-2" />
              <select
                value={groupAssignments[img.id] || img.defaultGroup || ""}
                onChange={(e) => assignGroup(img.id, e.target.value)}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="">Assign Group</option>
                {groupNames.map((name, index) => (
                  <option key={index} value={name || `Group ${String.fromCharCode(65 + index)}`}>
                    {name || `Group ${String.fromCharCode(65 + index)}`}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Saving..." : "Save Puzzle & Share"}
        </button>
      </div>
    </div>
  );
}
