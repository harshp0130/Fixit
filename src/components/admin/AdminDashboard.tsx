@@ .. @@
         <div className="relative px-8 py-12 text-white">
           <div className="flex items-center space-x-3 mb-4">
             <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
               <Shield className="h-8 w-8" />
             </div>
             <div>
-              <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
+              <h1 className="text-4xl font-bold mb-2">
+                {user?.role === 'super_admin' ? 'Master Admin Dashboard' : 'Sub Admin Dashboard'}
+              </h1>
               <p className="text-indigo-100 text-lg font-medium">
-                System Overview & Management
+                {user?.role === 'super_admin' 
+                  ? 'Full System Control & Management' 
+                  : `${user?.department} Department Management`
+                }
               </p>
             </div>
           </div>
           <p className="text-indigo-100 text-lg opacity-90">
-            Manage and oversee all support tickets across the system
+            {user?.role === 'super_admin' 
+              ? 'Master control over all departments, admins, and system settings'
+              : `Manage tickets and operations for ${user?.department} department`
+            }
           </p>
         </div>
       </div>