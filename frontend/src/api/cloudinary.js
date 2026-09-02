export const uploadImageToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'pingtalk_chat');

  const res = await fetch(
    'https://api.cloudinary.com/v1_1/tcb5qucv/image/upload',
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await res.json();
  return data.secure_url;
};