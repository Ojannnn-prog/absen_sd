export function getAvatarUrl(
  avatarConfig: string | null | undefined,
  profileImage: string | null | undefined,
  name: string,
  gender: string | null | undefined = 'L'
): string {
  if (avatarConfig) return avatarConfig;
  if (profileImage) return profileImage;
  
  const encodedName = encodeURIComponent(name);
  const avatarBg = gender === 'P' ? 'fce7f3' : 'e0f2fe';
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodedName}&backgroundColor=${avatarBg}`;
}
