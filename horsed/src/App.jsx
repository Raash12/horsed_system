import { useState, useEffect } from "react"
import { fetchUsers, addUser, updateUser, deleteUser } from "./supabaseClient"

export default function App() {
  const [users, setUsers] = useState([])
  const [name, setName] = useState("")
  const [editId, setEditId] = useState(null) // track editing user

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await fetchUsers()
      setUsers(data)
    } catch (err) {
      console.log(err.message)
    }
  }

  const handleAddOrUpdateUser = async () => {
    try {
      if (editId) {
        // Update existing user
        await updateUser(editId, name)
        setEditId(null)
      } else {
        // Add new user
        await addUser(name)
      }
      setName("")
      loadUsers()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleEdit = (user) => {
    setName(user.name)
    setEditId(user.id)
  }

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUser(id)
        loadUsers()
      } catch (err) {
        alert(err.message)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-80 text-center mb-6">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">Supabase CRUD 🚀</h1>


        <input
          className="border p-2 w-full mb-2 rounded"
          placeholder="Enter name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          onClick={handleAddOrUpdateUser}
          className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-lg w-full mb-2"
        >
          {editId ? "Update User" : "Add Userss"}
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow w-80 text-center">
        <h2 className="font-bold text-xl mb-2">Users:</h2>
        {users.length === 0 ? (
          <p className="text-gray-500">No users yet</p>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="flex justify-between items-center border-b py-2 px-2"
            >
              <span>{user.name}</span>
              <div className="space-x-2">
                <button
                  onClick={() => handleEdit(user)}
                  className="bg-yellow-400 hover:bg-yellow-600 text-white px-2 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(user.id)}
                  className="bg-red-500 hover:bg-red-700 text-white px-2 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}