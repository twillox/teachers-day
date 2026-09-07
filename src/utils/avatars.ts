export const avatarLibrary = [
  { id: 'star_neon', shape: 'star', color: '#39FF14' }, // Neon Green
  { id: 'star_pink', shape: 'star', color: '#FF00FF' }, // Magenta
  { id: 'star_amber', shape: 'star', color: '#FFBF00' }, // Amber
  { id: 'circle_cyan', shape: 'circle', color: '#00FFFF' }, // Cyan
  { id: 'circle_magenta', shape: 'circle', color: '#FF00FF' }, // Magenta
  { id: 'circle_gold', shape: 'circle', color: '#FFD700' }, // Gold
  { id: 'hex_purple', shape: 'hexagon', color: '#8A2BE2' }, // BlueViolet
  { id: 'hex_green', shape: 'hexagon', color: '#39FF14' }, // Neon Green
  { id: 'hex_orange', shape: 'hexagon', color: '#FF4500' }, // OrangeRed
  { id: 'diamond_cyan', shape: 'diamond', color: '#00FFFF' },
  { id: 'diamond_pink', shape: 'diamond', color: '#FF1493' }, // DeepPink
  { id: 'diamond_yellow', shape: 'diamond', color: '#FFFF00' },
  { id: 'square_blue', shape: 'square', color: '#1E90FF' }, // DodgerBlue
  { id: 'square_red', shape: 'square', color: '#FF0000' }, 
  { id: 'square_green', shape: 'square', color: '#00FF00' },
  { id: 'triangle_yellow', shape: 'triangle', color: '#FFFF00' },
  { id: 'triangle_cyan', shape: 'triangle', color: '#00FFFF' },
  { id: 'triangle_magenta', shape: 'triangle', color: '#FF00FF' },
  { id: 'burst_orange', shape: 'burst', color: '#FF8C00' },
  { id: 'burst_cyan', shape: 'burst', color: '#00FFFF' },
];

export function getRandomAvatarId(): string {
  const randomIndex = Math.floor(Math.random() * avatarLibrary.length);
  return avatarLibrary[randomIndex].id;
}

export function getAvatarConfig(id: string) {
  return avatarLibrary.find(a => a.id === id) || avatarLibrary[0];
}
