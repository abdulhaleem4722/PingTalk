export const uploadImageToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'pingtalk_chat');

  const isVideo = file.type.startsWith('video/');
  const resourceType = isVideo ? 'video' : 'image';

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/tcb5qucv/${resourceType}/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await res.json();

  if (!res.ok) {
    console.error('Cloudinary upload error:', data);
    throw new Error(data.error?.message || 'Upload failed');
  }

  return data.secure_url;
};