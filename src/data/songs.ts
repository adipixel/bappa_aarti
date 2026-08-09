import raw from './songs.json';

export interface Song {
  id: string;
  track: number;
  title: string;
  titleEn: string;
  lyrics: string;
  lyricsPending?: boolean;
  audio?: string;
}

export interface Playlist {
  id: string;
  title: string;
  titleEn: string;
  count: number;
  songs: Song[];
}

export const playlists: Playlist[] = (raw as { playlists: Playlist[] }).playlists;

export const getPlaylist = (id?: string): Playlist | undefined =>
  playlists.find((p) => p.id === id);

export const getSong = (
  playlistId?: string,
  songId?: string,
): { playlist: Playlist; song: Song; index: number } | undefined => {
  const playlist = getPlaylist(playlistId);
  if (!playlist) return undefined;
  const index = playlist.songs.findIndex((s) => s.id === songId);
  if (index === -1) return undefined;
  return { playlist, song: playlist.songs[index], index };
};

export interface SearchHit {
  playlist: Playlist;
  song: Song;
  /** Which field matched, so the UI can show why a result is here. */
  matchedIn: 'title' | 'lyrics';
}

/**
 * Matches Devanagari titles, Roman transliterations, and lyric lines, so a
 * user can find "Ghalin Lotangan" by typing either script.
 */
export function searchSongs(query: string): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const hits: SearchHit[] = [];
  for (const playlist of playlists) {
    for (const song of playlist.songs) {
      if (song.title.toLowerCase().includes(q) || song.titleEn.toLowerCase().includes(q)) {
        hits.push({ playlist, song, matchedIn: 'title' });
      } else if (song.lyrics.toLowerCase().includes(q)) {
        hits.push({ playlist, song, matchedIn: 'lyrics' });
      }
    }
  }
  return hits;
}
