// File: @app/admin-secure-dashboard-xyz123/books/page.tsx
import { getBooks } from "@/actions/books"; // Assuming this function exists
import BooksTableClient from "./BooksTableClient";

// Define and EXPORT the Book type here
// Consider moving this to a central types file (e.g., @/types/book.ts) later
export interface Book {
  id: string;
  title: string;
  author: string;
  level: string; // Consider using an enum: 'beginner' | 'intermediate' | 'advanced'
  language: string; // Consider using an enum: 'persian' | 'english'
  pages: number | null; // Allow null if pages might not be set
  description: string | null; // Allow null
  coverUrl: string | null; // Allow null
  createdAt: Date | string; // Allow string if Supabase returns string dates
  updatedAt: Date | string; // Allow string
  // Add any other relevant fields returned by getBooks()
}


// This is the main Server Component for the page
export default async function BooksPage() {
  // Fetch books on the server
  let books: Book[] = [];
  try {
    // Assuming getBooks returns { data: Book[] } or similar structure
    const result = await getBooks(); // Adjust based on actual getBooks implementation

    // More robust check for fetched data
     if (result && Array.isArray(result)) {
       books = result;
     } else if (result && Array.isArray(result.data)) {
       // Handle cases where data is nested, e.g., { data: [...] }
       books = result.data;
     } else {
       console.warn("Fetched books data is not in the expected array format:", result);
       // Proceed with empty array, but log a warning
     }
  } catch (error) {
    console.error("Error fetching books:", error);
    // Render an error message or fallback UI if desired
    // return <div>Error loading books. Please try again later.</div>;
  }

  // Render the Client Component, passing the fetched books
  return <BooksTableClient initialBooks={books} />;
}
