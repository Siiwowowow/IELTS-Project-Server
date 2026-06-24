async function ping() {
  try {
    const res = await fetch("http://localhost:5000/");
    console.log("Status:", res.status);
    console.log("Response:", await res.text());
  } catch (err) {
    console.error("Ping failed:", err);
  }
}
ping();
