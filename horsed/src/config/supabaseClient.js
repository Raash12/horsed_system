// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://wngfvjsteetbfkssmfue.supabase.co" // your project URL
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZ2Z2anN0ZWV0YmZrc3NtZnVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNDM5NzEsImV4cCI6MjA4OTgxOTk3MX0.HgFTqSrtp3DjnhqeyY8X7kFl-pJG75hX3EGhgUP0mKc" // your anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Create
export const addUser = async (name) => {
  if (!name) throw new Error("Name is required")
  const { data, error } = await supabase.from("users").insert([{ name }])
  if (error) throw error
  return data
}

// Read
export const fetchUsers = async () => {
  const { data, error } = await supabase.from("users").select("*")
  if (error) throw error
  return data
}

// Update
export const updateUser = async (id, name) => {
  const { data, error } = await supabase.from("users").update({ name }).eq("id", id)
  if (error) throw error
  return data
}

// Delete
export const deleteUser = async (id) => {
  const { data, error } = await supabase.from("users").delete().eq("id", id)
  if (error) throw error
  return data
}