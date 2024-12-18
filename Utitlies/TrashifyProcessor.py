import os
import re
import pandas as pd
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
from tkinter import Tk, filedialog, Label, Button, messagebox, PhotoImage, ttk

# MongoDB connection configuration
MONGO_URI = "mongodb://localhost:27017/"
DATABASE_NAME = "Trashify"
CUSTOMER_COLLECTION = "customers"
CREATOR_ID = "66e3d69de31834526cc73bf8"
DEPOSIT_COLLECTION = "deposits"
WASTE_TYPES_COLLECTION = "waste_types"

def process_csv_file(file_path):
    """
    Extracts data from a single CSV file and returns it as a dictionary.
    """
    try:
        df = pd.read_csv(file_path, header=None)
        details = df.iloc[4, 2]

        # Extracting fields using regex
        name = re.search(r"Name:\s*(.+)", details).group(1)
        gender = re.search(r"Gender:\s*(.+)", details).group(1)
        phone_number = re.search(r"Phone Number:\s*(.+)", details).group(1)
        address = re.search(r"Address:\s*(.+)", details).group(1)
        upi_id = re.search(r"UPI ID:\s*(.+)", details).group(1)
        decision = re.search(r"Decision:\s*(.+)", details).group(1)

        # Extract waste type and quantity
        waste_type_match = re.search(r"([\w\s&-]+)", df.iloc[8, 2])
        waste_type = waste_type_match.group(1).strip() if waste_type_match else "Unknown"
        quantity = re.search(r"Quantity:\s*(.+) kg", df.iloc[10, 2]).group(1)

        return {
            "File Name": os.path.basename(file_path),
            "Name": name,
            "Gender": gender,
            "Phone Number": phone_number,
            "Address": address,
            "UPI ID": upi_id,
            "Decision": decision,
            "Waste Type": waste_type,
            "Quantity (KG)": quantity,
        }
    except Exception as e:
        print(f"Error processing file {file_path}: {e}")
        return None


def extract_data_from_folder(input_folder_path):
    """
    Iterates through all CSV files in a folder and consolidates their data.
    """
    consolidated_data = []
    for file_name in os.listdir(input_folder_path):
        if file_name.endswith(".csv"):
            file_path = os.path.join(input_folder_path, file_name)
            file_data = process_csv_file(file_path)
            if file_data:
                consolidated_data.append(file_data)
    return consolidated_data


def save_to_excel(data, output_file_path):
    """
    Saves consolidated data to an Excel file.
    """
    try:
        consolidated_df = pd.DataFrame(data)
        consolidated_df.to_excel(output_file_path, index=False)
        print(f"Data successfully saved to {output_file_path}")
        messagebox.showinfo("Success", f"Data saved to Excel:\n{output_file_path}")
    except Exception as e:
        print(f"Error saving data to Excel: {e}")
        messagebox.showerror("Error", f"Error saving data to Excel: {e}")


def insert_data_to_mongo(data):
    """
    Inserts customer data into a MongoDB collection.
    """
    try:
        client = MongoClient(MONGO_URI)
        db = client[DATABASE_NAME]
        collection = db[CUSTOMER_COLLECTION]

        records = [
            {
                "full_name": row["Name"],
                "address": row["Address"],
                "gender": row["Gender"],
                "phone_number": str(row["Phone Number"]),
                "withdrawal_decision": row["Decision"],
                "balance": {"withdrawal": 0, "deposit": 0},
                "status": "active",
                "join_date": datetime.utcnow(),
                "creator": ObjectId(CREATOR_ID),
                "__v": 0,
            }
            for row in data
        ]

        if records:
            collection.insert_many(records)
            print(f"Inserted {len(records)} records into MongoDB.")
            messagebox.showinfo("Success", f"Inserted {len(records)} records into MongoDB.")
        client.close()
    except Exception as e:
        print(f"Error inserting data into MongoDB: {e}")
        messagebox.showerror("Error", f"Error inserting data into MongoDB: {e}")


def extract_and_insert_data(input_folder_path, output_file_path):
    """
    Orchestrates the data extraction, processing, and insertion pipeline.
    """
    # Step 1: Extract data from CSV files
    print("Extracting data from CSV files...")
    consolidated_data = extract_data_from_folder(input_folder_path)

    if not consolidated_data:
        print("No valid data extracted. Exiting...")
        messagebox.showwarning("No Data", "No valid data extracted. Exiting...")
        return

    # Step 2: Save consolidated data to Excel
    print("Saving data to Excel...")
    save_to_excel(consolidated_data, output_file_path)

    # Step 3: Insert data into MongoDB
    print("Inserting data into MongoDB...")
    insert_data_to_mongo(consolidated_data)


def select_folder():
    """
    Opens a folder selection dialog and runs the extraction pipeline.
    """
    input_folder_path = filedialog.askdirectory(title="Select Folder Containing CSV Files")
    if not input_folder_path:
        messagebox.showwarning("No Folder Selected", "Please select a folder to proceed.")
        return

    output_file_path = os.path.join(input_folder_path, "Customer_Details.xlsx")

    extract_and_insert_data(input_folder_path, output_file_path)
    process_and_insert_deposits("Customer_Details.xlsx")


def read_excel_file(file_path):
    """
    Reads the Excel file and extracts phone number, waste type, and quantity.
    """
    try:
        # Read Excel file into a DataFrame
        df = pd.read_excel(file_path)

        # Extract required columns (assuming the structure of the file)
        extracted_data = df[["Phone Number", "Waste Type", "Quantity (KG)"]]
        extracted_data = extracted_data.rename(columns={
            "Phone Number": "phone_number",
            "Waste Type": "waste_type",
            "Quantity (KG)": "quantity"
        })
        return extracted_data.to_dict(orient="records")
    except Exception as e:
        print(f"Error reading the Excel file: {e}")
        return []


def get_waste_type_price(waste_type_name):
    """
    Fetches the price and _id for a given waste type from the waste_types collection.
    Case-insensitive lookup.
    """
    client = MongoClient(MONGO_URI)
    db = client[DATABASE_NAME]
    waste_types_collection = db[WASTE_TYPES_COLLECTION]

    try:
        # Use case-insensitive regex for waste type name
        waste_type = waste_types_collection.find_one({
            "name": {"$regex": f"^{waste_type_name}$", "$options": "i"},
            "status": "active"
        })
        if waste_type:
            return waste_type["_id"], waste_type["price"]
        else:
            print(f"Waste type '{waste_type_name}' not found.")
            return None, None
    finally:
        client.close()


def get_customer_id_and_update_balance(phone_number, deposit_amount):
    """
    Fetches the customer _id using the phone number and updates their deposit balance.
    """
    client = MongoClient(MONGO_URI)
    db = client[DATABASE_NAME]
    customers_collection = db[CUSTOMER_COLLECTION]

    try:
        # Find the customer by phone number
        customer = customers_collection.find_one({"phone_number": str(phone_number)})
        if customer:
            # Update the deposit balance
            new_deposit_balance = customer["balance"]["deposit"] + deposit_amount
            customers_collection.update_one(
                {"_id": customer["_id"]},
                {"$set": {"balance.deposit": new_deposit_balance}}
            )
            return customer["_id"]
        else:
            print(f"Customer with phone number '{phone_number}' not found.")
            return None
    finally:
        client.close()


def update_waste_type_deposit_count(waste_type_id):
    """
    Updates the deposit count for a specific waste type in the waste_types collection.
    """
    client = MongoClient(MONGO_URI)
    db = client[DATABASE_NAME]
    waste_types_collection = db[WASTE_TYPES_COLLECTION]

    try:
        # Increment the deposit_count by 1
        waste_types_collection.update_one(
            {"_id": ObjectId(waste_type_id)},
            {"$inc": {"deposit_count": 1}}
        )
    except Exception as e:
        print(f"Error updating deposit count for waste type {waste_type_id}: {e}")
    finally:
        client.close()


def insert_into_deposit(deposits):
    """
    Inserts deposit records into the deposit collection.
    """
    client = MongoClient(MONGO_URI)
    db = client[DATABASE_NAME]
    deposit_collection = db[DEPOSIT_COLLECTION]

    try:
        if deposits:
            result = deposit_collection.insert_many(deposits)
            print(f"Inserted {len(result.inserted_ids)} deposit records into MongoDB.")
            
            # Update deposit_count for each waste type
            for deposit in deposits:
                update_waste_type_deposit_count(deposit["waste_type"])
        else:
            print("No deposits to insert.")
    except Exception as e:
        print(f"Error inserting deposits: {e}")
    finally:
        client.close()


def process_and_insert_deposits(file_path):
    """
    Main function to process the Excel file, insert deposit records, and update customer balances.
    """
    # Step 1: Read the Excel file
    print("Reading Excel file...")
    data = read_excel_file(file_path)
    if not data:
        print("No data found in the Excel file. Exiting...")
        return

    # Step 2: Process each record and prepare for insertion
    deposits = []
    for record in data:
        phone_number = record["phone_number"]
        waste_type_name = record["waste_type"]
        quantity = float(record["quantity"])

        # Fetch waste type price and _id
        waste_type_id, price_per_kg = get_waste_type_price(waste_type_name)
        if not waste_type_id or price_per_kg is None:
            print(f"Skipping record for waste type {waste_type_name} as it was not found.")
            continue

        # Calculate total amount
        total_amount = price_per_kg * quantity

        # Fetch customer ID and update their balance
        customer_id = get_customer_id_and_update_balance(phone_number, total_amount)
        if not customer_id:
            print(f"Skipping record for phone number {phone_number} as customer was not found.")
            continue

        # Prepare deposit record
        deposit_record = {
            "amount": total_amount,
            "weight": quantity,
            "waste_type": ObjectId(waste_type_id),
            "withdrawal_status": "ready",
            "customer": ObjectId(customer_id),
            "status": "active",
            "deposit_date": datetime.utcnow(),
            "creator": ObjectId(CREATOR_ID),
            "__v": 0
        }

        deposits.append(deposit_record)

    # Step 3: Insert deposits into MongoDB
    print("Inserting deposit records into MongoDB...")
    insert_into_deposit(deposits)




# GUI Setup
def main():
    root = Tk()
    root.title("Trashify - Automated Customer Data Processor")
    root.geometry("620x480")
    root.configure(bg="#F5F5F5")

    # Trashify Logo
    try:
        logo = PhotoImage(file="image.png")  # Add a logo file in the working directory
        logo_label = Label(root, image=logo, bg="#F5F5F5")
        logo_label.image = logo  # Prevent garbage collection
        logo_label.pack(pady=10)
    except:
        Label(root, text="Trashify", font=("Helvetica", 24, "bold"), bg="#F5F5F5", fg="#4CAF50").pack(pady=10)

    # Main Label
    Label(
        root,
        text="Customer Data Processor",
        font=("Helvetica", 18, "bold"),
        bg="#F5F5F5",
        fg="#333333",
    ).pack(pady=10)

    # Modern Button Styling
    style = ttk.Style()
    style.theme_use("clam")  # Use a modern theme
    style.configure(
        "TModern.TButton",
        font=("Helvetica", 14, "bold"),
        padding=10,
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
        text="Select Folder and Process",
        command=select_folder,
        style="TModern.TButton",
    )
    process_button.pack(pady=30)

    # Contributors Section
    Label(
        root,
        text="Contributors:\nVenkat Deepak J (20211CCS0056)\nAshish S (20211CCS0057)\nA Yuvaraja (20211CCS0062)\nSiddharth Bej (20211CCS0068)",
        font=("Helvetica", 10),
        bg="#F5F5F5",
        fg="#888888",
        justify="center",
    ).pack(pady=20)

    # Footer Label
    Label(
        root,
        text="© 2024 Trashify. All Rights Reserved.",
        font=("Helvetica", 9),
        bg="#F5F5F5",
        fg="#AAAAAA",
    ).pack(side="bottom", pady=10)

    root.mainloop()

if __name__ == "__main__":
    main()