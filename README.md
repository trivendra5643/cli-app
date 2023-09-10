CLI App Assignment by Trivendra Singh

This is a CLI app that returns the insights about API calls from the data in the log files.

Requirements
You need to have Node.js installed on your system.
After installing Node.js, install the following packages:
1). fs
2). readline
3). cli-table
4). chalk

How to use this?
1). First of all place all the log files you need inside the same directory.
2). Add and rename all the file names in the test.js file to your file names.
<img width="710" alt="Screenshot 2023-09-10 at 10 49 09 PM" src="https://github.com/trivendra5643/cli-app/assets/54612254/de51ed67-eede-4dac-b59e-d50922a53120">
3). Add the Status Name and their corresponding Status Codes for all the type of HTTP Response you have in your log files.
<img width="404" alt="Screenshot 2023-09-10 at 10 48 47 PM" src="https://github.com/trivendra5643/cli-app/assets/54612254/4fc8985f-e374-4cfc-968a-8a5e72f03f17">
4). After saving the changes in the test.js file, open the terminal and move to the directory where the files are located. Run the command node test.js in your terminal. You will see the insights in the form of tables as shown below.

Result
1). EndPoint vs API Call Count
<img width="314" alt="Screenshot 2023-09-10 at 10 44 43 PM" src="https://github.com/trivendra5643/cli-app/assets/54612254/bd25628a-39e4-4a87-ab3f-73276a890332">

2). Time Wise Per Minute API Call Count
<img width="160" alt="Screenshot 2023-09-10 at 10 47 42 PM" src="https://github.com/trivendra5643/cli-app/assets/54612254/0dbece66-8f3c-4719-bb7c-9dfe47d39c81">

3). HTTP Status Code vs API Call Count
<img width="371" alt="Screenshot 2023-09-10 at 10 48 04 PM" src="https://github.com/trivendra5643/cli-app/assets/54612254/dfc9db65-5f01-4863-a348-7ba752b0cbca">
