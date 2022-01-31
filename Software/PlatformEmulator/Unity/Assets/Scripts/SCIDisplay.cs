/**
 * This file is part of the STRAIDE Platform Emulator.
 * 
 * The Platform Emulator is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * The Platform Emulator is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with the Platform Emulator.  If not, see <http://www.gnu.org/licenses/>.
**/

using System.Collections;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// For some use cases it is nice to have additional displays in combination with STRAIDE.
/// Therefore, the Platform Emulator provides multiple canvas, to which a virtual camera can be streamed.
/// Using a virtual screen capture (e.g., using OBS), a secondary stream can be fed into the Platform Emulator.
/// This script should be appended to the Root node containing multiple planar objects.
/// The use can then press a key to toggle the virtual screens.
/// </summary>
public class SCIDisplay : MonoBehaviour
{
    public KeyCode key = KeyCode.P;
    private int targetDisplay = 0;
    private int _oldTarget = -1;

    private WebCamTexture _webcam = null;

    // Start is called before the first frame update
    void Start()
    {
        WebCamDevice[] devices = WebCamTexture.devices;
        for (var i = 0; i < devices.Length; i++)
            Debug.Log("Found Camera [" + i + "] named " + devices[i].name);

        targetDisplay = this.transform.childCount;

    }

    // Update is called once per frame
    void Update()
    {

        if (Input.GetKeyDown(key))
        {
            targetDisplay = (targetDisplay + 1) % (this.transform.childCount + 1);
            if(_webcam == null)
            {
                if (WebCamTexture.devices.Length > 0)
                {
                    Debug.Log("Will display camera[0] as display feed.");
                    _webcam = new WebCamTexture(WebCamTexture.devices[0].name);
                    _webcam.Play();
                }
            }
        }

        if(_oldTarget != targetDisplay)
        {
            _oldTarget = targetDisplay;
            for(int i = 0; i < this.transform.childCount+1; i++)
            {
                if(i == this.transform.childCount)
                {

                } else if(i == _oldTarget)
                {
                    this.transform.GetChild(i).gameObject.SetActive(true);
                    this.transform.GetChild(i).GetComponent<MeshRenderer>().material.mainTexture = _webcam;
                } else
                {
                    this.transform.GetChild(i).gameObject.SetActive(false);
                }
            }

        }
    }
}
