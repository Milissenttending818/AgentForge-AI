import os
from crewai.tools import BaseTool
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from dotenv import load_dotenv

load_dotenv()

class PDFRagTool(BaseTool):
    name: str = "pdf_rag_tool"
    description: str = "Search for information in a PDF document and return relevant context. Use this for technical details or context from the uploaded manual."

    def _run(self, query: str) -> str:
        pdf_path = os.path.join("data", "textbook.pdf")
        if not os.path.exists(pdf_path):
            return f"Error: PDF file not found at {pdf_path}. Please upload a document first."
        
        try:
            loader = PyPDFLoader(pdf_path)
            documents = loader.load()
            
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
            docs = text_splitter.split_documents(documents)
            
            embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
            vectorstore = FAISS.from_documents(docs, embeddings)
            
            results = vectorstore.similarity_search(query, k=3)
            return "\n\n".join([doc.page_content for doc in results])
        except Exception as e:
            return f"Error processing PDF: {str(e)}"
