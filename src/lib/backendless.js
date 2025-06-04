const APP_ID = process.env.NEXT_PUBLIC_BACKENDLESS_APP_ID;
const API_KEY = process.env.NEXT_PUBLIC_BACKENDLESS_API_KEY;
const BASE_URL = `https://api.backendless.com/${APP_ID}/${API_KEY}`;

console.log("🔍 APP_ID =", process.env.NEXT_PUBLIC_BACKENDLESS_APP_ID);
console.log("🔍 API_KEY =", process.env.NEXT_PUBLIC_BACKENDLESS_API_KEY);


export async function uploadImage(file, filename) {
  const form = new FormData();
  form.append("file", file, filename);

  const res = await fetch(
    `${BASE_URL}/files/uploads/${filename}`,
    {
      method: "POST",
      body: form,
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ Upload failed:", res.status, text);
    throw new Error("Upload failed");
  }

  const publicURL = `https://backendlessappcontent.com/${process.env.NEXT_PUBLIC_BACKENDLESS_APP_ID}/${process.env.NEXT_PUBLIC_BACKENDLESS_API_KEY}/files/uploads/${filename}`;
  return publicURL;
}



export async function savePuzzle(data) {
  console.log("Saving puzzle data:", data);
  
  // Create a more compact representation of the images
  const compactImages = data.images.map(img => ({
    u: img.url.split('/').pop(), // Store just the filename
    g: img.group // Store just the group letter (A, B, C, D)
  }));
  
  const puzzleData = {
    ___class: "puzzles",
    images: JSON.stringify(compactImages)
  };
  
  console.log("Formatted puzzle data:", puzzleData);
  
  const res = await fetch(`${BASE_URL}/data/puzzles`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "application-type": "REST"
    },
    body: JSON.stringify(puzzleData),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to save puzzle:", {
      status: res.status,
      statusText: res.statusText,
      error: errorText
    });
    throw new Error("Failed to save puzzle");
  }

  const json = await res.json();
  console.log("Save response:", json);
  return json.objectId;
}

export async function getPuzzle(id) {
  try {
    console.log("🔍 Fetching puzzle with ID:", id);
    console.log("🔍 Using BASE_URL:", BASE_URL);
    
    const res = await fetch(`${BASE_URL}/data/puzzles/${id}`);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Failed to fetch puzzle:", {
        status: res.status,
        statusText: res.statusText,
        error: errorText
      });
      throw new Error(`Failed to fetch puzzle: ${res.status} ${res.statusText}`);
    }
    
    const json = await res.json();
    console.log("✅ Raw puzzle data:", json);
    
    // Parse and expand the compact image data
    if (json.images && typeof json.images === 'string') {
      try {
        const compactImages = JSON.parse(json.images);
        // Reconstruct the full image data
        json.images = compactImages.map(img => ({
          url: `https://backendlessappcontent.com/${process.env.NEXT_PUBLIC_BACKENDLESS_APP_ID}/${process.env.NEXT_PUBLIC_BACKENDLESS_API_KEY}/files/uploads/${img.u}`,
          group: img.g
        }));
      } catch (e) {
        console.error("Failed to parse images string:", e);
      }
    }
    
    console.log("✅ Processed puzzle data:", json);
    return json;
  } catch (error) {
    console.error("❌ Error in getPuzzle:", error);
    throw error;
  }
}
