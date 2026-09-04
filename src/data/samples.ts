import { SampleSnippet } from '../types';

export const SAMPLE_SNIPPETS: SampleSnippet[] = [
  {
    id: 'python-calc',
    title: 'Python: Average Grade Calculator',
    language: 'python',
    category: 'Common Student Bugs',
    description: 'Off-by-one error, missing type casting from input, and division by zero vulnerability.',
    code: `def calculate_average(grades):
    # Bug 1: Indentation error and incorrect indexing
    total = 0
    for i in range(len(grades) + 1):
        total += grades[i]
    
    # Bug 2: Zero division when list is empty
    average = total / len(grades)
    return avg # Bug 3: NameError (avg is undefined, should be average)

student_scores = [85, 90, 78, 92, 88]
result = calculate_average(student_scores)
print("Student Average: " + result) # Bug 4: TypeError concatenating str and float`
  },
  {
    id: 'java-array',
    title: 'Java: Array Search & Max Finder',
    language: 'java',
    category: 'CS101 Basics',
    description: 'ArrayIndexOutOfBoundsException, null pointer risk, and comparison error.',
    code: `public class GradeFinder {
    public static void main(String[] args) {
        int[] scores = {75, 88, 95, 60, 82};
        int highest = findMax(scores);
        System.out.println("Highest score: " + highest);
    }

    public static int findMax(int[] arr) {
        // Bug 1: Starting max at 0 fails for negative arrays, but also bounds issue
        int max = arr[0];
        
        // Bug 2: <= causes ArrayIndexOutOfBoundsException
        for (int i = 1; i <= arr.length; i++) {
            if (arr[i] > max) {
                max = arr[i];
            }
        }
        
        // Bug 3: missing return statement for empty or general check
        return max;
    }
}`
  },
  {
    id: 'cpp-pointer',
    title: 'C++: Student List & Pointer Loop',
    language: 'cpp',
    category: 'Data Structures',
    description: 'Missing semicolon, pointer dereferencing issue, and memory leak.',
    code: `#include <iostream>
#include <string>
using namespace std;

int main() {
    int size = 5
    int* grades = new int[size];
    
    // Fill grades
    for (int i = 0; i < size; i++) {
        grades[i] = (i + 1) * 15;
    }
    
    cout << "Grades listed:" << endl;
    for (int i = 0; i <= size; i++) { // Bug: out of bounds access
        cout << "Grade " << i << ": " << *(grades + i) << endl;
    }
    
    // Bug: Memory leak! Forgot delete[] grades
    return 0;
}`
  },
  {
    id: 'js-cart',
    title: 'JavaScript: Shopping Cart Discount',
    language: 'javascript',
    category: 'Web Dev',
    description: 'Async promise unhandled, floating point rounding, and typo in property name.',
    code: `function calculateTotal(cartItems, discountCode) {
    let subtotal = 0;

    cartItems.forEach(item => {
        // Bug 1: Typo in item.prce instead of item.price
        subtotal += item.prce * item.quantity;
    });

    let discount = 0;
    // Bug 2: Loose equality bug or undefined discount
    if (discountCode = "STUDENT10") { // Assignment '=' instead of comparison '==='
        discount = subtotal * 0.10;
    }

    const finalTotal = subtotal - discnt; // Bug 3: ReferenceError 'discnt' is not defined
    return finalTotal.toFixed(2);
}

const items = [
    { name: "Notebook", price: 45.50, quantity: 2 },
    { name: "Ballpen", price: 15.00, quantity: 5 }
];

console.log("Total: ₱" + calculateTotal(items, "STUDENT10"));`
  },
  {
    id: 'csharp-student',
    title: 'C#: Student Management System',
    language: 'csharp',
    category: 'Object Oriented',
    description: 'Null reference exception, unassigned local variable, and string format bug.',
    code: `using System;
using System.Collections.Generic;

class Program {
    static void Main() {
        List<string> studentList; // Bug 1: Unassigned variable
        
        string newStudent = null;
        Console.WriteLine("Length: " + newStudent.Length); // Bug 2: NullReferenceException
        
        studentList.Add("Maria Santos");
        studentList.Add("Juan Dela Cruz");

        for (int i = 0; i < studentList.Count; i++) {
            Console.WriteLine(string.Format("Student {0}: {1}", i)); // Bug 3: FormatException missing param
        }
    }
}`
  },
  {
    id: 'sql-query',
    title: 'SQL: Enrollments & Grades Query',
    language: 'sql',
    category: 'Databases',
    description: 'Missing GROUP BY column, misplaced WHERE clause with aggregate, and syntax error.',
    code: `SELECT 
    s.student_id,
    s.full_name,
    COUNT(e.course_id) as enrolled_courses,
    AVG(e.final_grade) as gpa
FROM students s
LEFT JOIN enrollments e ON s.student_id = e.student_id
WHERE AVG(e.final_grade) >= 85.0 -- Bug: WHERE used with aggregate instead of HAVING
GROUP BY s.student_id -- Bug: full_name missing from GROUP BY
ORDER BY gpa DESC`
  }
];
