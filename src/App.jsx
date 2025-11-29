import React, { useState, useEffect } from 'react';
import { 
  User, Lock, LogIn, LogOut, Upload, ShoppingBag, 
  MapPin, Phone, Mail, Image as ImageIcon, X, CheckCircle, Loader, Camera 
} from 'lucide-react';

const API_BASE = 'https://lumaultimate.onrender.com/api';

// --- BACKEND API LAYER ---
const LumaDB = {
  // User Operations
  users: {
    getAll: async () => {
      try {
        const res = await fetch(`${API_BASE}/users`);
        return res.ok ? await res.json() : [];
      } catch (e) {
        console.error('Failed to fetch users:', e);
        return [];
      }
    },
    add: async (user) => {
      try {
        const res = await fetch(`${API_BASE}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user)
        });
        return res.ok ? await res.json() : null;
      } catch (e) {
        console.error('Failed to add user:', e);
        return null;
      }
    },
    update: async (updatedUser) => {
      try {
        const res = await fetch(`${API_BASE}/users/${updatedUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedUser)
        });
        return res.ok ? await res.json() : null;
      } catch (e) {
        console.error('Failed to update user:', e);
        return null;
      }
    }
  },

  // Artwork Operations
  art: {
    getAll: async () => {
      try {
        const res = await fetch(`${API_BASE}/art`);
        return res.ok ? await res.json() : [];
      } catch (e) {
        console.error('Failed to fetch art:', e);
        return [];
      }
    },
    add: async (newArt) => {
      try {
        const res = await fetch(`${API_BASE}/art`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newArt)
        });
        return res.ok ? await res.json() : null;
      } catch (e) {
        console.error('Failed to add art:', e);
        return null;
      }
    },
    delete: async (artId) => {
      try {
        const res = await fetch(`${API_BASE}/art/${artId}`, {
          method: 'DELETE'
        });
        return res.ok;
      } catch (e) {
        console.error('Failed to delete art:', e);
        return false;
      }
    }
  },

  // Session Operations (still use sessionStorage)
  session: {
    get: () => {
      const s = sessionStorage.getItem('luma_session');
      return s ? JSON.parse(s) : null;
    },
    set: (user) => sessionStorage.setItem('luma_session', JSON.stringify(user)),
    clear: () => sessionStorage.removeItem('luma_session')
  }
};

// --- UTILS ---
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

// --- MAIN APP COMPONENT ---
export default function Stage3App() {
  // --- STATE ---
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [view, setView] = useState('gallery');
  const [notification, setNotification] = useState(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    const loadData = async () => {
      const loadedUsers = await LumaDB.users.getAll();
      const loadedArt = await LumaDB.art.getAll();
      
      setUsers(loadedUsers);
      setArtworks(loadedArt);
      
      // Check Session
      const sessionUser = LumaDB.session.get();
      if (sessionUser) setUser(sessionUser);
    };
    
    loadData();
  }, []);

  // --- HELPERS ---
  const notify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // --- ACTIONS ---
  const handleLogin = (u) => {
    setUser(u);
    LumaDB.session.set(u);
    notify(`Welcome back, ${u.name}`);
  };

  const handleLogout = () => {
    setUser(null);
    LumaDB.session.clear();
    setView('gallery');
  };

  const handleUpdateUser = async (updatedUser) => {
    const result = await LumaDB.users.update(updatedUser);
    if (result) {
      setUser(result);
      setUsers(users.map(u => u.id === result.id ? result : u));
      LumaDB.session.set(result);
      notify("Profile Updated!");
    } else {
      notify("Failed to update profile");
    }
  };

  const handleUploadArt = async (newArt) => {
    const result = await LumaDB.art.add(newArt);
    if (result) {
      setArtworks([result, ...artworks]);
      notify("Artwork Uploaded Successfully!");
    } else {
      notify("Failed to upload artwork");
    }
  };

  const handleBuy = (art) => {
    if (user.role !== 'buyer') return alert("Please create a Buyer account to purchase.");
    
    const newOrder = {
      id: Date.now(),
      title: art.title,
      price: art.price,
      date: new Date().toLocaleDateString(),
      img: art.img
    };

    const updatedUser = { ...user, orders: [newOrder, ...user.orders] };
    handleUpdateUser(updatedUser); // Reuse update logic
    notify("Order Placed! Check your Profile.");
  };

  // --- CONDITIONAL RENDERING ---
  
  if (!user) {
    return (
      <AuthScreen 
        users={users} 
        setUsers={setUsers}
        onLogin={handleLogin} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-gray-100 font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 bg-rose-600 text-white px-6 py-3 rounded shadow-xl z-50 animate-bounce flex items-center gap-2">
          <CheckCircle size={18}/> {notification}
        </div>
      )}

      {/* Navbar */}
      <nav className="border-b border-white/10 bg-neutral-900/90 backdrop-blur sticky top-0 z-40 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('gallery')}>
          <div className="bg-rose-600 p-1 rounded">
            <span className="font-bold text-white">L</span>
          </div>
          <span className="text-xl font-bold">LUMA <span className="text-gray-500 font-normal">ULTIMATE</span></span>
        </div>

        <div className="flex items-center gap-6">
          <button onClick={() => setView('gallery')} className={`text-sm hover:text-white ${view === 'gallery' ? 'text-white font-bold' : 'text-gray-400'}`}>Gallery</button>
          {user.role === 'artist' && (
            <button onClick={() => setView('dashboard')} className={`text-sm hover:text-white ${view === 'dashboard' ? 'text-white font-bold' : 'text-gray-400'}`}>Studio</button>
          )}
          
          <div className="flex items-center gap-3 pl-6 border-l border-white/10">
            <button onClick={() => setView('profile')} className="flex items-center gap-3 hover:bg-white/5 p-2 rounded transition">
              <div className="text-right hidden md:block">
                <div className="text-sm font-bold">{user.name}</div>
                <div className="text-[10px] text-rose-500 uppercase tracking-wider font-bold">{user.role}</div>
              </div>
              <div className="w-9 h-9 bg-rose-600 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                 {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.name.charAt(0)}
              </div>
            </button>
            <button onClick={handleLogout} className="text-gray-500 hover:text-white"><LogOut size={18}/></button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {view === 'gallery' && <GalleryView artworks={artworks} onBuy={handleBuy} userRole={user.role} />}
        {view === 'profile' && <ProfileView user={user} artworks={artworks} onUpdateUser={handleUpdateUser} />}
        {view === 'dashboard' && <ArtistDashboard user={user} onUpload={handleUploadArt} />}
      </main>
    </div>
  );
}

// --- SUB COMPONENTS ---

const AuthScreen = ({ users, setUsers, onLogin }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    email: '', password: '', name: '', role: 'buyer', address: '', phone: '', bio: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSignup) {
      // Register
      if (users.find(u => u.email === formData.email)) return alert("Email taken!");
      
      const newUser = { ...formData, id: Date.now(), orders: [] };
      
      // Use DB Layer
      const updatedList = LumaDB.users.add(newUser);
      setUsers(updatedList);
      onLogin(newUser);
    } else {
      // Login
      const found = users.find(u => u.email === formData.email && u.password === formData.password);
      if (found) onLogin(found);
      else alert("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1518998053901-5348d3969105?auto=format&fit=crop&w=1600')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      
      <div className="relative z-10 bg-neutral-900 border border-white/10 w-full max-w-lg p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">LUMA GALLERY</h1>
          <p className="text-gray-400">Members Only Access</p>
        </div>

        <div className="flex gap-2 bg-neutral-800 p-1 rounded-lg mb-6">
          <button onClick={() => setIsSignup(false)} className={`flex-1 py-2 rounded-md text-sm font-bold transition ${!isSignup ? 'bg-white text-black' : 'text-gray-400'}`}>Log In</button>
          <button onClick={() => setIsSignup(true)} className={`flex-1 py-2 rounded-md text-sm font-bold transition ${isSignup ? 'bg-white text-black' : 'text-gray-400'}`}>Sign Up</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="grid grid-cols-2 gap-4">
                 <input required placeholder="Full Name" className="bg-black/40 border border-white/10 p-3 rounded text-white outline-none focus:border-rose-500" 
                   onChange={e => setFormData({...formData, name: e.target.value})} />
                 <select className="bg-black/40 border border-white/10 p-3 rounded text-white outline-none focus:border-rose-500"
                   onChange={e => setFormData({...formData, role: e.target.value})}>
                   <option value="buyer">Buyer</option>
                   <option value="artist">Artist</option>
                   <option value="curator">Curator</option>
                 </select>
              </div>
              <input required placeholder="Full Address (Shipping)" className="w-full bg-black/40 border border-white/10 p-3 rounded text-white outline-none focus:border-rose-500"
                   onChange={e => setFormData({...formData, address: e.target.value})} />
              <input required placeholder="Phone Number" className="w-full bg-black/40 border border-white/10 p-3 rounded text-white outline-none focus:border-rose-500"
                   onChange={e => setFormData({...formData, phone: e.target.value})} />
              <textarea placeholder="Short Bio" className="w-full bg-black/40 border border-white/10 p-3 rounded text-white outline-none focus:border-rose-500 h-20"
                   onChange={e => setFormData({...formData, bio: e.target.value})} />
            </div>
          )}

          <input required type="email" placeholder="Email Address" className="w-full bg-black/40 border border-white/10 p-3 rounded text-white outline-none focus:border-rose-500"
             onChange={e => setFormData({...formData, email: e.target.value})} />
          <input required type="password" placeholder="Password" className="w-full bg-black/40 border border-white/10 p-3 rounded text-white outline-none focus:border-rose-500"
             onChange={e => setFormData({...formData, password: e.target.value})} />

          <button className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-lg mt-4 transition-transform active:scale-95">
            {isSignup ? 'Create Account' : 'Enter Gallery'}
          </button>
        </form>
      </div>
    </div>
  );
};

const GalleryView = ({ artworks, onBuy, userRole }) => (
  <div>
    <h2 className="text-3xl font-bold mb-8">Live Collection</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {artworks.map(art => (
        <div key={art.id} className="bg-neutral-800 border border-white/5 rounded-xl overflow-hidden shadow-lg group hover:-translate-y-1 transition-transform duration-300">
          <div className="h-64 overflow-hidden relative">
            <img src={art.img} alt={art.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
            {userRole === 'buyer' && (
               <button onClick={() => onBuy(art)} className="absolute bottom-4 right-4 bg-white text-black px-4 py-2 rounded-full font-bold shadow hover:bg-rose-500 hover:text-white transition">
                 Buy ${art.price}
               </button>
            )}
          </div>
          <div className="p-5">
            <h3 className="font-bold text-lg">{art.title}</h3>
            <p className="text-gray-400 text-sm">{art.category} by {art.artist}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ProfileView = ({ user, artworks, onUpdateUser }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const base64 = await fileToBase64(e.dataTransfer.files[0]);
      onUpdateUser({ ...user, avatar: base64 });
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const base64 = await fileToBase64(e.target.files[0]);
      onUpdateUser({ ...user, avatar: base64 });
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      {/* Profile Card */}
      <div className="bg-neutral-800 border border-white/10 rounded-2xl p-8 mb-8 flex flex-col md:flex-row gap-8">
        
        {/* Avatar Section with Drag & Drop */}
        <div className="flex flex-col items-center">
          <div 
            className={`relative w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold border-4 border-rose-600 overflow-hidden cursor-pointer transition-colors ${dragActive ? 'bg-rose-500/50' : 'bg-neutral-700'}`}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          >
             {user.avatar ? (
                <img src={user.avatar} className="w-full h-full object-cover" />
             ) : (
                user.name.charAt(0)
             )}
             
             {/* Overlay for Drag Hint */}
             <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
               <Camera className="text-white" />
               <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
             </div>
          </div>
          <span className="mt-4 bg-white/10 px-3 py-1 rounded text-xs uppercase font-bold text-rose-500">{user.role}</span>
          <p className="text-[10px] text-gray-500 mt-2">Drag & Drop to Update</p>
        </div>
        
        {/* Info Section */}
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-3xl font-bold">{user.name}</h2>
            <p className="text-gray-400">{user.email}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/20 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-300"><MapPin size={16} className="text-rose-500"/> {user.address || "No address set"}</div>
            <div className="flex items-center gap-2 text-sm text-gray-300"><Phone size={16} className="text-rose-500"/> {user.phone || "No phone set"}</div>
            <div className="col-span-2 text-sm text-gray-400 italic">"{user.bio || "No bio available"}"</div>
          </div>
        </div>
      </div>

      {/* --- ROLE SPECIFIC CONTENT --- */}

      {/* 1. BUYER: Orders */}
      {user.role === 'buyer' && (
        <div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><ShoppingBag className="text-rose-500"/> My Collection</h3>
          {user.orders && user.orders.length > 0 ? (
            <div className="space-y-4">
              {user.orders.map(order => (
                <div key={order.id} className="bg-neutral-800 p-4 rounded-lg border border-white/5 flex items-center gap-4">
                  <img src={order.img} className="w-16 h-16 rounded object-cover" />
                  <div className="flex-1">
                    <h4 className="font-bold">{order.title}</h4>
                    <p className="text-xs text-gray-500">Purchased on {order.date}</p>
                  </div>
                  <div className="font-bold text-rose-500">${order.price}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 py-10 text-center bg-neutral-800/50 rounded-xl">No orders found. Go to the Gallery to buy art!</div>
          )}
        </div>
      )}

      {/* 2. ARTIST: Uploaded Works */}
      {user.role === 'artist' && (
        <div>
           <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><ImageIcon className="text-rose-500"/> My Portfolio</h3>
           {artworks.filter(a => a.artist === user.name).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                 {artworks.filter(a => a.artist === user.name).map(art => (
                    <div key={art.id} className="bg-neutral-800 rounded-lg overflow-hidden border border-white/5">
                       <img src={art.img} className="w-full h-40 object-cover" />
                       <div className="p-3">
                          <div className="font-bold text-sm truncate">{art.title}</div>
                          <div className="text-xs text-rose-500 font-bold">${art.price}</div>
                       </div>
                    </div>
                 ))}
              </div>
           ) : (
              <div className="text-gray-500 py-10 text-center bg-neutral-800/50 rounded-xl">You haven't uploaded any art yet. Go to Studio!</div>
           )}
        </div>
      )}
    </div>
  );
};

// --- DRAG & DROP UPLOADER ---
const ArtistDashboard = ({ user, onUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({ title: '', price: '', category: 'Digital' });

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const base64 = await fileToBase64(e.dataTransfer.files[0]);
      setPreview(base64);
    }
  };

  const handleFile = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const base64 = await fileToBase64(e.target.files[0]);
      setPreview(base64);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    onUpload({
      id: Date.now(),
      artist: user.name,
      img: preview || "https://images.unsplash.com/photo-1549490349-8643362247b5?w=800",
      ...form
    });
    setPreview(null);
    setForm({ title: '', price: '', category: 'Digital' });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Artist Studio</h2>
      
      <form onSubmit={submit} className="bg-neutral-800 border border-white/10 p-8 rounded-2xl shadow-lg">
        {/* Drag Drop Zone */}
        {/* Added 'relative' class here to fix the overlay issue */}
        <div 
          className={`relative h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center mb-6 transition-colors ${
            dragActive ? "border-rose-500 bg-rose-500/10" : "border-white/20 bg-black/20"
          }`}
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        >
          {preview ? (
            <div className="relative h-full w-full p-2">
              <img src={preview} className="h-full w-full object-contain rounded" />
              <button type="button" onClick={() => setPreview(null)} className="absolute top-2 right-2 bg-black/80 p-1 rounded-full text-white"><X size={16}/></button>
            </div>
          ) : (
            <div className="text-center text-gray-400 pointer-events-none">
              <Upload className="mx-auto mb-2 text-rose-500" size={32}/>
              <p className="font-bold">Drag & Drop Image Here</p>
              <p className="text-xs">or click to browse</p>
            </div>
          )}
          {/* Hidden input for click-to-upload simulation */}
          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFile} />
        </div>

        <div className="space-y-4">
          <input required placeholder="Artwork Title" className="w-full bg-black/40 border border-white/10 p-3 rounded text-white outline-none focus:border-rose-500"
             value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
          <div className="flex gap-4">
             <input required type="number" placeholder="Price ($)" className="flex-1 bg-black/40 border border-white/10 p-3 rounded text-white outline-none focus:border-rose-500"
                value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
             <select className="flex-1 bg-black/40 border border-white/10 p-3 rounded text-white outline-none focus:border-rose-500"
                value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option>Digital</option>
                <option>Painting</option>
                <option>Sculpture</option>
             </select>
          </div>
          <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-lg transition">
            Publish Artwork
          </button>
        </div>
      </form>
    </div>
  );
};
