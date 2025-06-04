import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabase";
import Image from "next/image";

const defaultGroupColors = {
  "Group A": "#F3DE7D",
  "Group B": "#A7C168",
  "Group C": "#B2C4EB",
  "Group D": "#B085C2",
};

export default function PlayPage() {
  const router = useRouter();
  const { id } = router.query;

  const [tiles, setTiles] = useState([]);
  const [selected, setSelected] = useState([]);
  const [solved, setSolved] = useState({});
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupNames, setGroupNames] = useState([]);
  const [groupColors, setGroupColors] = useState(defaultGroupColors);
  const [oneAway, setOneAway] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    setLoading(true);
    
    const fetchPuzzle = async () => {
      try {
        // Fetch puzzle images
        const { data: images, error: imagesError } = await supabase
          .from('images')
          .select('*')
          .eq('puzzle_id', id);

        if (imagesError) throw imagesError;

        if (!images || images.length !== 16) {
          setError("Puzzle not found or incomplete");
          return;
        }

        // Get unique group names from images
        const uniqueGroups = [...new Set(images.map(img => img.group_name))];
        setGroupNames(uniqueGroups);

        // Create custom group colors
        const colors = {};
        uniqueGroups.forEach((name, index) => {
          colors[name] = Object.values(defaultGroupColors)[index];
        });
        setGroupColors(colors);

        // Shuffle the images
        const shuffled = images
          .map(img => ({ ...img, id: crypto.randomUUID() }))
          .sort(() => Math.random() - 0.5);

        setTiles(shuffled);
      } catch (error) {
        console.error('Error fetching puzzle:', error);
        setError("Failed to load puzzle");
      } finally {
        setLoading(false);
      }
    };

    fetchPuzzle();
  }, [id]);

  const toggleSelect = (tileId) => {
    if (solved[tileId]) return;
    if (selected.includes(tileId)) {
      setSelected(selected.filter((id) => id !== tileId));
    } else if (selected.length < 4) {
      setSelected([...selected, tileId]);
    }
  };

  const checkMatch = () => {
    if (selected.length !== 4) return;
    const selectedTiles = tiles.filter((t) => selected.includes(t.id));
    const groups = selectedTiles.map((t) => t.group_name);
    const allSame = groups.every((g) => g === groups[0]);

    if (allSame) {
      const group = groups[0];
      const newSolved = { ...solved };
      selected.forEach((id) => (newSolved[id] = group));
      setSolved(newSolved);
      setSelected([]);
      setOneAway(false);
    } else {
      // Check if three match
      const groupCounts = {};
      groups.forEach(group => {
        groupCounts[group] = (groupCounts[group] || 0) + 1;
      });
      const hasThree = Object.values(groupCounts).some(count => count === 3);
      
      setOneAway(hasThree);
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setOneAway(false);
      }, 600);
      setSelected([]);
    }
  };

  useEffect(() => {
    if (selected.length === 4) checkMatch();
  }, [selected]);

  const allSolved = Object.keys(solved).length === 16;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
          Summer&apos;s Connections
        </h1>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading puzzle...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {oneAway && (
          <div className="text-center py-4 text-yellow-600 font-semibold animate-bounce text-xl">
            One away...
          </div>
        )}

        {!loading && !error && tiles.length > 0 && (
          <div className={`grid grid-cols-4 gap-3 md:gap-4 ${shake ? "animate-shake" : ""}`}>
            {tiles.map((tile) => {
              const isSelected = selected.includes(tile.id);
              const isSolved = solved[tile.id];
              const bg = isSolved ? groupColors[isSolved] : isSelected ? "#e0e0e0" : "#ffffff";
              
              return (
                <div
                  key={tile.id}
                  onClick={() => toggleSelect(tile.id)}
                  className={`
                    cursor-pointer rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all
                    ${isSelected ? 'ring-4 ring-purple-500' : ''}
                    ${isSolved ? 'ring-4 ring-opacity-50' : ''}
                    transform hover:scale-105 duration-200
                    relative
                  `}
                  style={{ 
                    backgroundColor: bg,
                    aspectRatio: "3/2"
                  }}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={tile.url}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 25vw, 20vw"
                      className="object-cover"
                      onError={(e) => {
                        console.error("Image failed to load:", tile.url);
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                  {isSolved && (
                    <div 
                      className="absolute bottom-2 right-2 text-xs font-bold px-3 py-1 rounded-full shadow-md z-10"
                      style={{ 
                        backgroundColor: `${groupColors[isSolved]}99`,
                        color: '#000000',
                        backdropFilter: 'blur(4px)'
                      }}
                    >
                      {isSolved}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {allSolved && (
          <div className="mt-8 text-center">
            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 mb-2 animate-bounce">
              🎉 Congratulations!
            </div>
            <div className="text-xl text-gray-600">
              You&apos;ve solved all the connections!
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          50% { transform: translateX(4px); }
          75% { transform: translateX(-4px); }
          100% { transform: translateX(0); }
        }
        .animate-shake {
          animation: shake 0.4s;
        }
      `}</style>
    </div>
  );
}
