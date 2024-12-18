import tkinter as tk
from tkinter import ttk
from tkinter import messagebox
from pymongo import MongoClient
import bcrypt
from bson import ObjectId
from datetime import datetime

# MongoDB connection setup
client = MongoClient('mongodb://localhost:27017')  # Change this if you use a different connection string
db = client['Trashify']
users_collection = db['users']

# Function to add a user
def add_user():
    full_name = entry_full_name.get()
    username = entry_username.get()
    email = entry_email.get()
    password = entry_password.get()
    refer_id = entry_refer_id.get()

    # Check if refer_id exists in the users collection
    if not ObjectId.is_valid(refer_id):
        messagebox.showerror("Invalid Refer ID", "Refer ID format is invalid.")
        return

    refer_user = users_collection.find_one({"_id": ObjectId(refer_id)})
    
    if refer_user is None:
        messagebox.showerror("User Not Found", f"User with refer_id {refer_id} does not exist. Insert failed.")
        return

    # Hash the password
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    # Create the user data to insert
    user_data = {
        "full_name": full_name,
        "username": username.lower(),
        "email": email,
        "password": hashed_password.decode('utf-8'),
        "status": "active",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }

    # Insert the new user into the collection
    result = users_collection.insert_one(user_data)
    
    if result.acknowledged:
        messagebox.showinfo("Success", f"User {full_name} added successfully with ID {result.inserted_id}.")
    else:
        messagebox.showerror("Error", "Error occurred while adding the user.")

# GUI setup
root = tk.Tk()
root.title("Trashify - Add Admin")

# Set window size
root.geometry("500x500")

# Load and display an image
img = tk.PhotoImage(file="image.png")  # Make sure your image is in the same directory
label_image = tk.Label(root, image=img)
label_image.pack(pady=10)

# Input fields
label_full_name = tk.Label(root, text="Full Name")
label_full_name.pack()
entry_full_name = tk.Entry(root)
entry_full_name.pack(pady=5)

label_username = tk.Label(root, text="Username")
label_username.pack()
entry_username = tk.Entry(root)
entry_username.pack(pady=5)

label_email = tk.Label(root, text="Email")
label_email.pack()
entry_email = tk.Entry(root)
entry_email.pack(pady=5)

label_password = tk.Label(root, text="Password")
label_password.pack()
entry_password = tk.Entry(root, show="*")
entry_password.pack(pady=5)

label_refer_id = tk.Label(root, text="Refer ID")
label_refer_id.pack()
entry_refer_id = tk.Entry(root)
entry_refer_id.pack(pady=5)

# Add User button
style = ttk.Style()
style.theme_use("clam")  # Use a modern theme
style.configure(
    "TModern.TButton",
    font=("Helvetica", 14, "bold"),
    padding=5,
    background="#4CAF50",
    foreground="#FFFFFF",
    borderwidth=0,
    focuscolor="none",
)
style.map(
    "TModern.TButton",
    background=[("active", "#45A049"), ("pressed", "#388E3C")],  # Active and pressed color
    foreground=[("active", "#FFFFFF")],
)

# Process Button
process_button = ttk.Button(
    root,
    text="Add Admin",
    command=add_user,
    style="TModern.TButton",
)
process_button.pack(pady=30)

# Footer text
tk.Label(
    root,
    text="© 2024 Trashify. All Rights Reserved.",
    font=("Helvetica", 9),
    bg="#F5F5F5",
    fg="#AAAAAA",
).pack(side="bottom", pady=10)
    
# Start the Tkinter event loop
root.mainloop()
