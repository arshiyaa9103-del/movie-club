import { useState, useEffect, useRef } from "react";
import { useSearchMovies, getSearchMoviesQueryKey, type MovieSearchResult } from "@workspace/api-client-react";
import { Search, Loader2 } from "lucide-react";

interface MovieSearchProps {
  onSelect: (movie: MovieSearchResult) => void;
}

export function MovieSearch({ onSelect }: MovieSearchProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const searchParams = { q: debouncedQuery };
  const { data: results, isLoading } = useSearchMovies(
    searchParams,
    { query: { enabled: debouncedQuery.length > 2, queryKey: getSearchMoviesQueryKey(searchParams) } }
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search for movies to add..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-input border border-border rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {isLoading && debouncedQuery.length > 2 && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && debouncedQuery.length > 2 && results && (
        <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-80 overflow-auto">
          {results.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">No movies found.</div>
          ) : (
            <ul className="py-1">
              {results.map((movie) => (
                <li key={movie.imdbId}>
                  <button
                    onClick={() => {
                      onSelect(movie);
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-muted/50 flex gap-3 items-center"
                  >
                    {movie.poster && movie.poster !== "N/A" ? (
                      <img src={movie.poster} alt={movie.title} className="w-8 h-12 object-cover rounded-sm" />
                    ) : (
                      <div className="w-8 h-12 bg-muted rounded-sm flex items-center justify-center">
                        <Film className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm line-clamp-1">{movie.title}</p>
                      <p className="text-xs text-muted-foreground">{movie.year}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
import { Film } from "lucide-react";