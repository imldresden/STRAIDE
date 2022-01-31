using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

/// <summary>
/// Prints all console log messages into a GUI textarea.
/// </summary>
public class ConsoleToGUI : MonoBehaviour
{
    public Text textarea; 

    static string myLog = "";
    private string output;
    private string stack;

    void OnEnable()
    {
        Application.logMessageReceivedThreaded += Log;
    }

    void OnDisable()
    {
        Application.logMessageReceivedThreaded -= Log;
    }

    public void Log(string logString, string stackTrace, LogType type)
    {
        output = logString;
        stack = stackTrace;
        myLog = output + "\n" + myLog;
        if (myLog.Length > 5000)
        {
            myLog = myLog.Substring(0, 4000);
        }
    }

    void OnGUI()
    {
        textarea.text = myLog;
    }

}
