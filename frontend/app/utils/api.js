// export const backendUrl = "http://localhost:3001";

export async function fetchUsers() {
  const res = await fetch(`${backendUrl}/auth/users`);
  return res.json();
}

export const backendUrl = "https://realtimechat-h3w4.onrender.com";

// export const backendUrl = "http://localhost:3001";
